import Foundation
import Vision
import AppKit

struct RecognizedLine: Codable {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OCRResult: Codable {
    let full_text: String
    let confidence: Int
    let lines: [RecognizedLine]
    let engine: String
}

guard CommandLine.arguments.count > 1 else {
    let err = ["error": "Usage: vision_ocr <image_path>"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

let imagePath = CommandLine.arguments[1]
let url = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: url),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    let err = ["error": "Could not read image file at \(imagePath)"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.automaticallyDetectsLanguage = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    let err = ["error": "Vision error: \(error.localizedDescription)"]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(1)
}

guard let observations = request.results as? [VNRecognizedTextObservation], !observations.isEmpty else {
    let emptyResult = OCRResult(full_text: "", confidence: 0, lines: [], engine: "apple_vision")
    if let data = try? JSONEncoder().encode(emptyResult),
       let str = String(data: data, encoding: .utf8) {
        print(str)
    }
    exit(0)
}

// Sort observations top-to-bottom (in Vision, y=1 is top, y=0 is bottom), then left-to-right
let sortedObservations = observations.sorted { obs1, obs2 in
    // If lines are roughly at the same vertical band (within 3% of height), sort left-to-right
    let yDiff = abs(obs1.boundingBox.origin.y - obs2.boundingBox.origin.y)
    if yDiff < 0.035 {
        return obs1.boundingBox.origin.x < obs2.boundingBox.origin.x
    }
    return obs1.boundingBox.origin.y > obs2.boundingBox.origin.y
}

var lines: [RecognizedLine] = []
var textLines: [String] = []
var confSum: Float = 0.0

for obs in sortedObservations {
    guard let candidate = obs.topCandidates(1).first else { continue }
    let str = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
    if str.isEmpty { continue }

    textLines.append(str)
    confSum += candidate.confidence

    let bbox = obs.boundingBox
    lines.append(RecognizedLine(
        text: str,
        confidence: candidate.confidence,
        x: Double(bbox.origin.x),
        y: Double(bbox.origin.y),
        width: Double(bbox.size.width),
        height: Double(bbox.size.height)
    ))
}

let avgConf = lines.isEmpty ? 0 : Int((confSum / Float(lines.count)) * 100)
let fullText = textLines.joined(separator: "\n")

let result = OCRResult(
    full_text: fullText,
    confidence: avgConf,
    lines: lines,
    engine: "apple_vision"
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted]
if let data = try? encoder.encode(result),
   let jsonString = String(data: data, encoding: .utf8) {
    print(jsonString)
}
