const PictureList = document.getElementById("PictureList");
const UploadButton = document.getElementById("UploadButton");
const ClearButton = document.getElementById("ClearButton");
const DebugPanel = document.getElementById("DebugPanel");
const PictureDisplay = document.getElementById("PictureDisplay");
const PictureCanvas = document.getElementById("PictureCanvas");
const DrawCanvas = document.getElementById("DrawCanvas");
const ToolMove = document.getElementById("ToolMove");
const ToolDraw = document.getElementById("ToolDraw");
const ToolErase = document.getElementById("ToolErase");
const ToolZoomIn = document.getElementById("ToolZoomIn");
const ToolZoomOut = document.getElementById("ToolZoomOut");
const ToolColor = document.getElementById("ToolColor");
const ToolSize = document.getElementById("ToolSize");
const ToolClear = document.getElementById("ToolClear");
const ToolUndo = document.getElementById("ToolUndo");

let Moving = false, Drawing = false, Erasing = false;
let Start = { X: 0, Y: 0 }, Last = { X: 0, Y: 0 };
let Picture = { W: 0, H: 0 }, Max = { W: 0, H: 0 }, Actual = { W: 0, H: 0 };
let ZoomScale = 1, Zoom = { X: 0, Y: 0 }, Current = { X: 0, Y: 0 };
const OffScreenCanvas = document.createElement("canvas");

setInterval(() => {
    DebugPanel.innerHTML = `Moving: ${Moving}
Drawing: ${Drawing}
Erasing: ${Erasing}
Picture: ${Picture.W}, ${Picture.H}
Max: ${Max.W}, ${Max.H}
Actual: ${Actual.W}, ${Actual.H}
ZoomScale: ${ZoomScale}
Current: ${Current.X}, ${Current.Y}
Start: ${Start.X}, ${Start.Y}
Last: ${Last.X}, ${Last.Y}
Zoom: ${Zoom.X}, ${Zoom.Y}`;
}, 100);

const SelectImage = (Base64) => {
    const ImageData = new Image();
    ImageData.src = Base64;
    Picture.W = ImageData.width;
    Picture.H = ImageData.height;
    Max.W = PictureDisplay.clientWidth;
    Max.H = PictureDisplay.clientHeight;
    const Scale = Math.min(Max.W / Picture.W, Max.H / Picture.H);
    Actual.W = Picture.W * Scale;
    Actual.H = Picture.H * Scale;
    const ImageHistory = [];

    OffScreenCanvas.width = PictureCanvas.width = DrawCanvas.width = Actual.W;
    OffScreenCanvas.height = PictureCanvas.height = DrawCanvas.height = Actual.H;
    OffScreenCanvas.style.width = PictureCanvas.style.width = DrawCanvas.style.width = Actual.W + "px";
    OffScreenCanvas.style.height = PictureCanvas.style.height = DrawCanvas.style.height = Actual.H + "px";
    const OffScreenContext = OffScreenCanvas.getContext("2d");
    const ImageContext = PictureCanvas.getContext("2d");
    const DrawContext = DrawCanvas.getContext("2d");
    const UpdateCanvas = () => {
        ImageContext.clearRect(0, 0, Actual.W / ZoomScale, Actual.H / ZoomScale);
        ImageContext.drawImage(ImageData, Zoom.X, Zoom.Y, Actual.W, Actual.H);
        DrawContext.clearRect(0, 0, Actual.W / ZoomScale, Actual.H / ZoomScale);
        DrawContext.drawImage(OffScreenCanvas, Zoom.X, Zoom.Y, Actual.W, Actual.H);
    };
    const ActualToCanvas = (Cor) => {
        return {
            X: Cor["X"] / ZoomScale - Zoom.X,
            Y: Cor["Y"] / ZoomScale - Zoom.Y,
        };
    };
    const CanvasToActual = (Cor) => {
        return {
            X: Cor["X"] * ZoomScale + Zoom.X,
            Y: Cor["Y"] * ZoomScale + Zoom.Y,
        };
    }

    ImageData.onload = () => {
        UpdateCanvas();
    };

    const StartDraw = () => {
        ImageHistory.push(OffScreenContext.getImageData(0, 0, Actual.W, Actual.H));
        if (ToolMove.checked) {
            Moving = true;
        }
        else if (ToolDraw.checked) {
            OffScreenContext.lineWidth = ToolSize.value;
            OffScreenContext.strokeStyle = ToolColor.value;
            Drawing = true;
        }
        else if (ToolErase.checked) {
            Erasing = true;
        }
        Start = Last = Current;
    };
    const ProcessDraw = () => {
        if (Moving) {
            Zoom.X += (Current.X - Start.X);
            Zoom.Y += (Current.Y - Start.Y);
        }
        else if (Drawing) {
            OffScreenContext.beginPath();
            OffScreenContext.moveTo(Last.X, Last.Y);
            OffScreenContext.lineTo(Current.X, Current.Y);
            OffScreenContext.stroke();
        }
        else if (Erasing) {
            OffScreenContext.clearRect(Current.X - ToolSize.value * 5, Current.Y - ToolSize.value * 5,
                ToolSize.value * 10, ToolSize.value * 10);
        }
        Last = Current;
        UpdateCanvas();
    };
    const EndDraw = () => {
        Moving = Drawing = Erasing = false;
    };

    DrawCanvas.addEventListener("pointerdown", (Event) => {
        Current = ActualToCanvas({ X: Event.offsetX, Y: Event.offsetY });
        StartDraw();
    });
    DrawCanvas.addEventListener("pointermove", (Event) => {
        const Events = Event.getCoalescedEvents();
        Events.forEach((Event) => {
            Current = ActualToCanvas({ X: Event.offsetX, Y: Event.offsetY });
            ProcessDraw();
        });
    });
    DrawCanvas.addEventListener("pointerup", () => {
        EndDraw();
    });
    DrawCanvas.addEventListener("pointerout", () => {
        EndDraw();
    });

    ToolZoomIn.addEventListener("click", () => {
        ZoomScale *= 1.1;
        ImageContext.scale(1.1, 1.1);
        DrawContext.scale(1.1, 1.1);
        UpdateCanvas();
    });
    ToolZoomOut.addEventListener("click", () => {
        ZoomScale /= 1.1;
        ImageContext.scale(1 / 1.1, 1 / 1.1);
        DrawContext.scale(1 / 1.1, 1 / 1.1);
        UpdateCanvas();
    });
    ToolClear.addEventListener("click", () => {
        ImageHistory.push(OffScreenContext.getImageData(0, 0, Actual.W, Actual.H));
        OffScreenContext.clearRect(0, 0, Actual.W, Actual.H);
        UpdateCanvas();
    });
    ToolUndo.addEventListener("click", () => {
        if (ImageHistory.length > 0) {
            OffScreenContext.putImageData(ImageHistory.pop(), 0, 0);
            UpdateCanvas();
        }
    });
};

const RefreshPictures = () => {
    PictureList.innerHTML = "";
    PictureList.appendChild(CreatePlaceHolder());
    RequestAPI("GetPictures", {}, () => {
        PictureList.innerHTML = "";
    }, (Data) => {
        if (Data.length === 0) {
            PictureList.innerHTML = "<li class='list-group-item w-100 text-center'>暂无图片</li>";
        }
        Data.forEach((Picture) => {
            const PictureElement = document.createElement("li");
            PictureElement.className = "list-group-item w-100 p-0 mb-1";
            PictureElement.innerHTML = `<img src="${Picture.Base64}" class="rounded me-2 float-start w-100">`;
            PictureElement.addEventListener("click", () => {
                SelectImage(Picture.Base64);
            });
            PictureList.appendChild(PictureElement);
        });
    }, () => { }, () => { });
};
UploadButton.addEventListener("click", () => {
    const FileInput = document.createElement("input");
    FileInput.type = "file";
    FileInput.accept = "image/*";
    FileInput.click();
    FileInput.addEventListener("change", () => {
        const File = FileInput.files[0];
        const Reader = new FileReader();
        Reader.onload = () => {
            AddLoading(UploadButton);
            UploadButton.disabled = true;
            RequestAPI("UploadPicture", { Base64: Reader.result }, () => {
                RemoveLoading(UploadButton);
                UploadButton.disabled = false;
            }, () => {
                ShowSuccess("上传成功");
                RefreshPictures();
            }, () => { }, () => { });
        };
        Reader.readAsDataURL(File);
    });
});
ClearButton.addEventListener("click", () => {
    AddLoading(ClearButton);
    ClearButton.disabled = true;
    RequestAPI("ClearPictures", {}, () => {
        RemoveLoading(ClearButton);
        ClearButton.disabled = false;
    }, () => {
        ShowSuccess("清空成功");
        RefreshPictures();
    }, () => { }, () => { });
});
RefreshPictures();