import React, { useState, useEffect } from "react";
import DecryptedText from "./DecryptedText";

const SYSTEM_MESSAGES = [
    "[Decrypting Request...]",
    "[Accessing Secure Archives...]",
    "[Verifying Trust Protocols...]",
    "[Synthesizing Response...]",
    "[Establishing Connection...]"
];

export default function SystemProcessing() {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % SYSTEM_MESSAGES.length);
        }, 2500); // Change message every 2.5s

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="system-processing" style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            fontFamily: "monospace",
            color: "var(--accent-color)",
            fontSize: "0.9rem",
            background: "rgba(0, 255, 65, 0.05)",
            border: "1px solid rgba(0, 255, 65, 0.1)",
            borderRadius: "8px",
            width: "fit-content",
            marginTop: "10px"
        }}>
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <DecryptedText
                text={SYSTEM_MESSAGES[msgIndex]}
                speed={80}
                maxIterations={15}
                useOriginalCharsOnly={true}
                className="processing-text"
                encryptedClassName="encrypted-processing"
                animateOn="view"
                revealDirection="start"
            />
        </div>
    );
}
