import Foundation
import Vision
import CoreImage
import AppKit

struct RecognizedLine: Codable {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct ScannerOutput: Codable {
    let full_text: String
    let confidence: Int
    let lines: [RecognizedLine]
    let engine: String
    let card_detected: Bool
    let dewarped_image_path: String?
}

guard CommandLine.arguments.count > 1 else {
    let err = ["error": "Usage: scanner_tool <input_image_path> [output_dewarped_path]"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments.count > 2 ? CommandLine.arguments[2] : nil
let inputUrl = URL(fileURLWithPath: inputPath)

guard let inputNsImage = NSImage(contentsOf: inputUrl),
      let inputCgImage = inputNsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    let err = ["error": "Could not read image file at \(inputPath)"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

let ciContext = CIContext(options: nil)
var workingCgImage = inputCgImage
var cardDetected = false
var savedDewarpedPath: String? = nil

// 1. Attempt Card Boundary / Rectangle Detection if input is large enough
let rectRequest = VNDetectRectanglesRequest()
rectRequest.minimumAspectRatio = 0.35
rectRequest.maximumAspectRatio = 0.95 // In Vision, aspect ratio is height/width (or width/height <= 1)
rectRequest.minimumConfidence = 0.4
rectRequest.maximumObservations = 1

let rectHandler = VNImageRequestHandler(cgImage: inputCgImage, options: [:])
try? rectHandler.perform([rectRequest])

if let rectObservation = rectRequest.results?.first,
   rectObservation.confidence >= 0.45 {
    // A distinct card contour was detected! Let's dewarp it
    let imgWidth = CGFloat(inputCgImage.width)
    let imgHeight = CGFloat(inputCgImage.height)

    let ciImage = CIImage(cgImage: inputCgImage)

    // Convert normalized Vision points (origin bottom-left) to pixel coordinates
    let tl = CGPoint(x: rectObservation.topLeft.x * imgWidth, y: rectObservation.topLeft.y * imgHeight)
    let tr = CGPoint(x: rectObservation.topRight.x * imgWidth, y: rectObservation.topRight.y * imgHeight)
    let br = CGPoint(x: rectObservation.bottomRight.x * imgWidth, y: rectObservation.bottomRight.y * imgHeight)
    let bl = CGPoint(x: rectObservation.bottomLeft.x * imgWidth, y: rectObservation.bottomLeft.y * imgHeight)

    // Check if the detected rectangle is at least 15% of the total area (not a tiny button)
    let approxWidth = (hypot(tr.x - tl.x, tr.y - tl.y) + hypot(br.x - bl.x, br.y - bl.y)) / 2.0
    let approxHeight = (hypot(tl.x - bl.x, tl.y - bl.y) + hypot(tr.x - br.x, tr.y - br.y)) / 2.0
    let areaRatio = (approxWidth * approxHeight) / (imgWidth * imgHeight)

    if areaRatio > 0.15 && areaRatio < 0.98 {
        if let perspectiveFilter = CIFilter(name: "CIPerspectiveCorrection") {
            perspectiveFilter.setValue(ciImage, forKey: kCIInputImageKey)
            perspectiveFilter.setValue(CIVector(cgPoint: tl), forKey: "inputTopLeft")
            perspectiveFilter.setValue(CIVector(cgPoint: tr), forKey: "inputTopRight")
            perspectiveFilter.setValue(CIVector(cgPoint: br), forKey: "inputBottomRight")
            perspectiveFilter.setValue(CIVector(cgPoint: bl), forKey: "inputBottomLeft")

            if let dewarpedCI = perspectiveFilter.outputImage {
                // Apply subtle document scan enhancement (clean contrast and sharpness)
                var enhancedCI = dewarpedCI
                if let colorFilter = CIFilter(name: "CIColorControls") {
                    colorFilter.setValue(enhancedCI, forKey: kCIInputImageKey)
                    colorFilter.setValue(1.1, forKey: kCIInputContrastKey)
                    colorFilter.setValue(1.05, forKey: kCIInputSaturationKey)
                    if let out = colorFilter.outputImage { enhancedCI = out }
                }

                if let dewarpedCG = ciContext.createCGImage(enhancedCI, from: enhancedCI.extent) {
                    workingCgImage = dewarpedCG
                    cardDetected = true

                    // Save dewarped card image if output path specified
                    if let outPath = outputPath {
                        let rep = NSBitmapImageRep(cgImage: dewarpedCG)
                        if let pngData = rep.representation(using: .png, properties: [:]) {
                            try? pngData.write(to: URL(fileURLWithPath: outPath))
                            savedDewarpedPath = outPath
                        }
                    }
                }
            }
        }
    }
}

// 2. Perform Apple Vision Neural ML Text Recognition on working image
let textRequest = VNRecognizeTextRequest()
textRequest.recognitionLevel = .accurate
textRequest.usesLanguageCorrection = true
textRequest.automaticallyDetectsLanguage = true

let textHandler = VNImageRequestHandler(cgImage: workingCgImage, options: [:])
do {
    try textHandler.perform([textRequest])
} catch {
    let err = ["error": "Vision error: \(error.localizedDescription)"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

guard let observations = textRequest.results as? [VNRecognizedTextObservation], !observations.isEmpty else {
    let emptyResult = ScannerOutput(
        full_text: "",
        confidence: 0,
        lines: [],
        engine: "apple_vision_ml",
        card_detected: cardDetected,
        dewarped_image_path: savedDewarpedPath
    )
    if let data = try? JSONEncoder().encode(emptyResult),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(0)
}

// Sort lines from top to bottom (y=1 is top, y=0 is bottom), and left to right for lines on same row
let sortedObservations = observations.sorted { obs1, obs2 in
    let yDiff = abs(obs1.boundingBox.origin.y - obs2.boundingBox.origin.y)
    if yDiff < 0.035 {
        return obs1.boundingBox.origin.x < obs2.boundingBox.origin.x
    }
    return obs1.boundingBox.origin.y > obs2.boundingBox.origin.y
}

var recognizedLines: [RecognizedLine] = []
var textLines: [String] = []
var confSum: Float = 0.0

for obs in sortedObservations {
    guard let candidate = obs.topCandidates(1).first else { continue }
    let str = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
    if str.isEmpty { continue }

    textLines.append(str)
    confSum += candidate.confidence

    let bbox = obs.boundingBox
    recognizedLines.append(RecognizedLine(
        text: str,
        confidence: candidate.confidence,
        x: Double(bbox.origin.x),
        y: Double(bbox.origin.y),
        width: Double(bbox.size.width),
        height: Double(bbox.size.height)
    ))
}

let avgConf = recognizedLines.isEmpty ? 0 : Int((confSum / Float(recognizedLines.count)) * 100)
let fullText = textLines.joined(separator: "\n")

let output = ScannerOutput(
    full_text: fullText,
    confidence: avgConf,
    lines: recognizedLines,
    engine: "apple_vision_ml",
    card_detected: cardDetected,
    dewarped_image_path: savedDewarpedPath
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted]
if let data = try? encoder.encode(output),
   let jsonString = String(data: data, encoding: .utf8) {
    print(jsonString)
}
