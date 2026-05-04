"use client";
import { useEffect, useState } from "react";
import Drawing from "../drawing/drawing";

import pendulum  from "./json/pendulum_sample.json";
import nucleus from "./json/nucleus_sample.json"
import shm from "./json/shm_sample.json"
export const diagramMap: Record<string, any> = {
    pendulum,
    nucleus,
    shm
};

export default function CanvasPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const hash = window.location.hash.slice(1); // "pendulum"
        if (hash && diagramMap[hash]) {
            setData(diagramMap[hash]);
        }
    }, []);

    return <Drawing data={data} />;
}
