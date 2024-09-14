class useDrag {
    constructor() {
        this.clicked = false;
        this.dragging = false;
        this.position = 0;
    }

    dragStart = (ev) => {
        this.position = ev.clientX;
        this.clicked = true;
    };

    dragStop = () => {
        window.requestAnimationFrame(() => {
            this.dragging = false;
            this.clicked = false;
        });
    };

    dragMove = (ev, cb) => {
        const newDiff = this.position - ev.clientX;

        const movedEnough = Math.abs(newDiff) > 5;

        if (this.clicked && movedEnough) {
            this.dragging = true;
        }

        if (this.dragging && movedEnough) {
            this.position = ev.clientX;
            cb(newDiff);
        }
    };
}

export default useDrag