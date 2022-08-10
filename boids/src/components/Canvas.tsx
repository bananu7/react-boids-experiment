import React, {createRef, useEffect, Ref, useRef} from "react";
import "./Canvas.css"

export type CanvasProps = {
    canvasReady: (canvas: Ref<HTMLCanvasElement>) => void
}

function Canvas(props: CanvasProps) {

    const hasRendered = useRef(false);

    let canvas: Ref<HTMLCanvasElement> = createRef();

    useEffect(() => {
        if (hasRendered.current) {
            return;
        }
        props.canvasReady(canvas);
        hasRendered.current = true;
    }, []);

    return (
        <canvas className="canvas rounded-lg" ref={canvas}/>
    )
}

export default Canvas