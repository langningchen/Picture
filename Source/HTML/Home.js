const PictureList = document.getElementById("PictureList");
const UploadButton = document.getElementById("UploadButton");
const ClearButton = document.getElementById("ClearButton");
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

(() => {
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
                    const OffScreenCanvas = document.createElement("canvas");
                    const ImageData = new Image();
                    ImageData.src = Picture.Base64;
                    const PictureWidth = ImageData.width;
                    const PictureHeight = ImageData.height;
                    const MaxWidth = PictureDisplay.clientWidth;
                    const MaxHeight = PictureDisplay.clientHeight;
                    const Scale = Math.min(MaxWidth / PictureWidth, MaxHeight / PictureHeight);
                    const ActualWidth = PictureWidth * Scale;
                    const ActualHeight = PictureHeight * Scale;
                    const ImageHistory = [];

                    OffScreenCanvas.width = PictureCanvas.width = DrawCanvas.width = ActualWidth;
                    OffScreenCanvas.height = PictureCanvas.height = DrawCanvas.height = ActualHeight;
                    OffScreenCanvas.style.width = PictureCanvas.style.width = DrawCanvas.style.width = ActualWidth + "px";
                    OffScreenCanvas.style.height = PictureCanvas.style.height = DrawCanvas.style.height = ActualHeight + "px";
                    const OffScreenContext = OffScreenCanvas.getContext("2d");
                    const ImageContext = PictureCanvas.getContext("2d");
                    const DrawContext = DrawCanvas.getContext("2d");
                    ImageData.onload = () => {
                        ImageContext.drawImage(ImageData, 0, 0, ActualWidth, ActualHeight);
                    };

                    let Moving = false, Drawing = false, Erasing = false;
                    let MoveDeltaX, MoveDeltaY;
                    let LastX, LastY;
                    let Zoom = 1, ZoomX = 0, ZoomY = 0;

                    const UpdateCanvas = () => {
                        ImageContext.clearRect(0, 0, ActualWidth * Zoom, ActualHeight * Zoom);
                        ImageContext.drawImage(ImageData, ZoomX, ZoomY, ActualWidth * Zoom, ActualHeight * Zoom);
                        DrawContext.clearRect(0, 0, ActualWidth * Zoom, ActualHeight * Zoom);
                        DrawContext.drawImage(OffScreenCanvas, ZoomX, ZoomY, ActualWidth * Zoom, ActualHeight * Zoom);
                    };

                    const StartDraw = (X, Y) => {
                        ImageHistory.push(OffScreenContext.getImageData(0, 0, ActualWidth, ActualHeight));
                        if (ToolMove.checked) {
                            Moving = true;
                            MoveDeltaX = X;
                            MoveDeltaY = Y;
                        }
                        else if (ToolDraw.checked) {
                            OffScreenContext.lineWidth = ToolSize.value;
                            OffScreenContext.strokeStyle = ToolColor.value;
                            Drawing = true;
                        }
                        else if (ToolErase.checked) {
                            Erasing = true;
                        }
                        LastX = X;
                        LastY = Y;
                    };
                    const ProcessDraw = (X, Y) => {
                        if (Moving) {
                            ZoomX += (X - MoveDeltaX) / Zoom;
                            ZoomY += (Y - MoveDeltaY) / Zoom;
                            MoveDeltaX = X;
                            MoveDeltaY = Y;
                            UpdateCanvas();
                        }
                        else if (Drawing) {
                            OffScreenContext.beginPath();
                            OffScreenContext.moveTo((LastX / Zoom - ZoomX) / Zoom, (LastY / Zoom - ZoomY) / Zoom);
                            OffScreenContext.lineTo((X / Zoom - ZoomX) / Zoom, (Y / Zoom - ZoomY) / Zoom);
                            OffScreenContext.stroke();
                            LastX = X;
                            LastY = Y;
                        }
                        else if (Erasing) {
                            OffScreenContext.clearRect(X - ToolSize.value * 5, Y - ToolSize.value * 5,
                                ToolSize.value * 10, ToolSize.value * 10);
                        }
                        UpdateCanvas();
                    };
                    const EndDraw = () => {
                        Moving = Drawing = Erasing = false;
                    };
                    DrawCanvas.addEventListener("mousedown", (Event) => {
                        StartDraw(Event.offsetX, Event.offsetY);
                    });
                    DrawCanvas.addEventListener("mousemove", (Event) => {
                        ProcessDraw(Event.offsetX, Event.offsetY);
                    });
                    DrawCanvas.addEventListener("mouseup", () => {
                        EndDraw();
                    });
                    DrawCanvas.addEventListener("touchstart", (Event) => {
                        StartDraw(Event.touches[0].clientX - DrawCanvas.getBoundingClientRect().left,
                            Event.touches[0].clientY - DrawCanvas.getBoundingClientRect().top);
                        Event.preventDefault();
                    });
                    DrawCanvas.addEventListener("touchmove", (Event) => {
                        ProcessDraw(Event.touches[0].clientX - DrawCanvas.getBoundingClientRect().left,
                            Event.touches[0].clientY - DrawCanvas.getBoundingClientRect().top);
                        Event.preventDefault();
                    });
                    DrawCanvas.addEventListener("touchend", (Event) => {
                        EndDraw();
                        Event.preventDefault();
                    });

                    ToolZoomIn.addEventListener("click", () => {
                        Zoom *= 1.1;
                        ImageContext.scale(1.1, 1.1);
                        DrawContext.scale(1.1, 1.1);
                        UpdateCanvas();
                    });
                    ToolZoomOut.addEventListener("click", () => {
                        Zoom /= 1.1;
                        ImageContext.scale(1 / 1.1, 1 / 1.1);
                        DrawContext.scale(1 / 1.1, 1 / 1.1);
                        UpdateCanvas();
                    });
                    ToolClear.addEventListener("click", () => {
                        ImageHistory.push(OffScreenContext.getImageData(0, 0, ActualWidth, ActualHeight));
                        OffScreenContext.clearRect(0, 0, ActualWidth, ActualHeight);
                        UpdateCanvas();
                    });
                    ToolUndo.addEventListener("click", () => {
                        if (ImageHistory.length > 0) {
                            OffScreenContext.putImageData(ImageHistory.pop(), 0, 0);
                            UpdateCanvas();
                        }
                    });
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
})();