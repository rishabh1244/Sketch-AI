import Navbar from "../navbar/navbar";
import styles from "./landing.module.css";
import Canvas from "../canvas";
export default function Landing() {
    return (<>

        <Navbar />
        <div className={styles.canvas}>
            <Canvas url={"api/sample_diagram"} />
        </div>
    </>
    );
}

