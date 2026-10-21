"use client";

import React from "react";
import { CreditCard, Building2, Phone, Mail } from "lucide-react";

export default function StatsBar({ cards = [] }) {
  const totalCards = cards.length;

  const uniqueCompanies = new Set(
    cards.map((c) => c.company?.trim().toLowerCase()).filter(Boolean)
  ).size;

  const totalPhones = cards.filter((c) => c.phone?.trim()).length;
  const totalEmails = cards.filter((c) => c.email?.trim()).length;

  const stats = [
    {
      label: "Total Scanned Cards",
      value: totalCards,
      icon: CreditCard,
      color: "#6366f1",
      bgColor: "rgba(99, 102, 241, 0.12)"
    },
    {
      label: "Companies Identified",
      value: uniqueCompanies,
      icon: Building2,
      color: "#06b6d4",
      bgColor: "rgba(6, 182, 212, 0.12)"
    },
    {
      label: "Phone Numbers",
      value: totalPhones,
      icon: Phone,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.12)"
    },
    {
      label: "Email Contacts",
      value: totalEmails,
      icon: Mail,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.12)"
    }
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
      gap: 12,
      marginBottom: 20
    }}>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: "14px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: "var(--radius-md)",
              background: stat.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${stat.color}33`
            }}>
              <Icon size={19} color={stat.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 3,
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
