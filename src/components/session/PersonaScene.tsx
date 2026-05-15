import {
  Compass,
  MapPinned,
  Mic2,
  ScanSearch,
  ShieldHalf,
  Sparkle,
} from "lucide-react";
import type { IntroPersona } from "@/modules/spark/engines/personalities";

/**
 * Per-method scenography motif. Renderiza una animación atmosférica
 * propia del método (rings, grid+scan, strikes, nodes+links, spotlight).
 *
 * Usado dentro de:
 *  - MethodIntroStage (intro grande del método en /sessions/new)
 *  - MethodSessionShell header (background sutil durante la sesión activa)
 *
 * Las animaciones viven en globals.css con prefijo `method-scene-`.
 */
export function PersonaScene({
  persona,
  accent,
}: {
  persona: IntroPersona;
  accent: string;
}) {
  if (persona === "mentor") {
    return (
      <div className="method-scene">
        <span className="method-scene-rings" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <Compass className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "detective") {
    return (
      <div className="method-scene">
        <div className="method-scene-grid" aria-hidden />
        <div className="method-scene-scan" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <ScanSearch className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "rival") {
    return (
      <div className="method-scene">
        <span className="method-scene-strike method-scene-strike--a" aria-hidden />
        <span className="method-scene-strike method-scene-strike--b" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <ShieldHalf className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "cartographer") {
    return (
      <div className="method-scene">
        <span className="method-scene-node" style={{ top: "30%", left: "62%" }} aria-hidden />
        <span
          className="method-scene-node"
          style={{ top: "60%", left: "78%", animationDelay: "-0.7s" }}
          aria-hidden
        />
        <span
          className="method-scene-node"
          style={{ top: "70%", left: "55%", animationDelay: "-1.4s" }}
          aria-hidden
        />
        <span
          className="method-scene-link"
          style={{
            top: "34%",
            left: "55%",
            width: "20%",
            transform: "rotate(28deg)",
          }}
          aria-hidden
        />
        <span
          className="method-scene-link"
          style={{
            top: "64%",
            left: "57%",
            width: "18%",
            transform: "rotate(-15deg)",
          }}
          aria-hidden
        />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <MapPinned className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "director") {
    return (
      <div className="method-scene">
        <div className="method-scene-spotlight" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <Mic2 className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  return (
    <div className="method-scene">
      <span className="method-scene-icon" style={{ color: accent }} aria-hidden>
        <Sparkle className="w-5 h-5" strokeWidth={1.5} />
      </span>
    </div>
  );
}
