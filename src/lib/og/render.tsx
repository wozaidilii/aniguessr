/* Satori paints <img>, not next/image. */
/* eslint-disable @next/next/no-img-element */
import React from "react";
import { OG_CHROME, formatCount } from "~/lib/og/copy";
import { ogFontFamily } from "~/lib/og/fonts";
import type { OgCard } from "~/lib/og/card";
import {
  PANEL_X,
  PIN_ICON_SVG,
  buildMapSvg,
  clusterRadius,
  type MarkerCluster,
} from "~/lib/og/map";
import { edgeMargin, splitEdgeSpace, visibleText } from "~/lib/og/text";

const PIN_ICON = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PIN_ICON_SVG)}`;

function svgUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function ClusterLabel({ cluster }: { cluster: MarkerCluster }) {
  const radius = clusterRadius(cluster.n);
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL_X + cluster.x - radius,
        top: cluster.y - radius,
        width: radius * 2,
        height: radius * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Sora",
        fontWeight: 700,
        fontSize: cluster.n >= 100 ? 22 : 24,
        color: "#0a0612",
      }}
    >
      {formatCount(cluster.n)}
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        fontFamily: "Sora",
      }}
    >
      <span
        style={{
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 3.64,
          color: "#fff7fb",
        }}
      >
        {OG_CHROME.logo}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginLeft: 14,
          paddingLeft: 14,
          borderLeft: "2px solid rgba(255,255,255,0.12)",
          fontSize: 20,
          fontWeight: 400,
          color: "#8f86a0",
          fontFamily: "Sora",
        }}
      >
        <span style={{ fontFamily: "Sora" }}>{OG_CHROME.by}</span>
        <span
          style={{
            marginLeft: 8,
            fontWeight: 600,
            color: "#F1804F",
            fontFamily: "Sora",
          }}
        >
          {OG_CHROME.brand}
        </span>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        fontSize: 22,
        color: "#8f86a0",
        fontFamily: "Sora",
      }}
    >
      <span style={{ fontFamily: "Sora", fontWeight: 600, color: "#c9bfd2" }}>
        {OG_CHROME.domain}
      </span>
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          background: "#8f86a0",
          marginLeft: 16,
          marginRight: 16,
        }}
      />
      <span style={{ fontFamily: "Sora" }}>{OG_CHROME.copyright}</span>
    </div>
  );
}

export function OgCardImage({ card }: { card: OgCard }) {
  const family = ogFontFamily(card.contentLocale);
  const subtitleHeight = Math.round((card.subtitleSize || 28) * 1.4);
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0a0612",
        fontFamily: family,
      }}
    >
      {/* Decorative base. No tiles, Street View, or anime imagery. */}
      <img
        alt=""
        src={svgUri(buildMapSvg(card.markers))}
        width={730}
        height={630}
        style={{ position: "absolute", right: 0, top: 0 }}
      />
      {card.markers.clusters.map((cluster, index) => (
        <ClusterLabel key={`${cluster.x}-${cluster.y}-${index}`} cluster={cluster} />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          background:
            "linear-gradient(90deg, #0a0612 0px, #0a0612 470px, rgba(10,6,18,0.86) 560px, rgba(10,6,18,0.25) 720px, rgba(10,6,18,0) 860px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          background:
            "linear-gradient(0deg, rgba(10,6,18,0.55), rgba(10,6,18,0) 120px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 60,
          width: 640,
          height: 510,
          display: "flex",
          flexDirection: "column",
          color: "#fff7fb",
        }}
      >
        <Logo />
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              border: "2px solid rgba(103,232,249,0.34)",
              background: "rgba(8,145,178,0.14)",
              color: "#cffafe",
              borderRadius: 999,
              padding: "7px 18px",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 0.96,
              lineHeight: 1.2,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: "#67e8f9",
                marginRight: 10,
              }}
            />
            <span style={{ whiteSpace: "nowrap", fontFamily: family }}>{card.chip}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 22 }}>
            {card.titleLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: Math.round(card.titleSize * card.titleLineHeight),
                  fontSize: card.titleSize,
                  fontWeight: 700,
                  color: "#fff7fb",
                  whiteSpace: "nowrap",
                  fontFamily: family,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          {card.subtitleLines.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
              {card.subtitleLines.map((line, index) => (
                <div
                  key={`${line.body}-${line.suffix}-${index}`}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    height: subtitleHeight,
                    fontSize: card.subtitleSize,
                    whiteSpace: "nowrap",
                    fontFamily: family,
                  }}
                >
                  {line.body ? (
                    <span
                      style={{
                        color: "#f9a8d4",
                        fontWeight: 700,
                        fontFamily: family,
                      }}
                    >
                      {line.body}
                    </span>
                  ) : null}
                  {line.suffix ? (
                    <span
                      style={{
                        marginLeft: line.body ? edgeMargin(card.subtitleSize) : 0,
                        color: "#c9bfd2",
                        fontWeight: 500,
                        fontFamily: family,
                        whiteSpace: "pre",
                      }}
                    >
                      {visibleText(line.suffix)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginTop: 18,
              fontSize: 28,
              fontWeight: 500,
              color: "#c9bfd2",
            }}
          >
            <img alt="" src={PIN_ICON} width={26} height={26} />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                marginLeft: 12,
                whiteSpace: "nowrap",
              }}
            >
              {card.stat.map((part, index) => {
                const edge = splitEdgeSpace(part.text);
                if (!edge.text) return null;
                return (
                  <span
                    key={`${edge.text}-${index}`}
                    style={{
                      marginLeft: edge.lead ? edgeMargin(28) : 0,
                      marginRight: edge.trail ? edgeMargin(28) : 0,
                      fontFamily: part.strong ? "Sora" : family,
                      fontWeight: part.strong ? 700 : 500,
                      color: part.strong ? "#fff7fb" : "#c9bfd2",
                      whiteSpace: "pre",
                    }}
                  >
                    {edge.text}
                  </span>
                );
              })}
            </div>
          </div>
          {card.pills.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                marginTop: 18,
                height: 112,
                overflow: "hidden",
              }}
            >
              {card.pills.map((pill, index) => (
                <div
                  key={`${pill}-${index}`}
                  style={{
                    display: "flex",
                    border: "2px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 24,
                    lineHeight: 1.3,
                    color: "#f8e7ff",
                    fontWeight: 400,
                    marginRight: 10,
                    marginBottom: 10,
                    whiteSpace: "nowrap",
                    fontFamily: family,
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Footer />
      </div>
    </div>
  );
}
