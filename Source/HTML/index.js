const PageContent = document.getElementById("PageContent");
const AlertList = document.getElementById("AlertList");
const ToastList = document.getElementById("ToastList");

const PathToName = (Path) => {
    let Name = "";
    for (let i = 0; i < Path.length; i++) {
        if (i != 0 && Path.charCodeAt(i) >= 65 && Path.charCodeAt(i) <= 90) {
            Name += " " + Path[i].toLowerCase();
        }
        else {
            Name += Path[i];
        }
    }
    return Name;
};
const NameToPath = (Name) => {
    Name = Name.split(" ");
    let Path = "";
    for (let i = 0; i < Name.length; i++) {
        Path += Name[i].charAt(0).toUpperCase() + Name[i].substr(1)
    }
    return Path;
};
const CopyTextToClipboard = (Text) => {
    let TextArea = document.createElement("textarea"); document.body.appendChild(TextArea);
    TextArea.value = Text;
    TextArea.style.position = "fixed";
    TextArea.style.top = "0";
    TextArea.style.left = "0";
    TextArea.style.width = "2em";
    TextArea.style.height = "2em";
    TextArea.style.padding = "0";
    TextArea.style.border = "none";
    TextArea.style.outline = "none";
    TextArea.style.boxShadow = "none";
    TextArea.style.background = "transparent";
    TextArea.focus();
    TextArea.select();
    try {
        document.execCommand("copy");
        ShowSuccess("Copied!");
    } catch (e) {
        ShowError("Failed to copy!");
    }
    document.body.removeChild(TextArea);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const RequestAPI = async (Action, Data, CallBack, SuccessCallback, FailCallback, ErrorCallback) => {
    let Abort = new AbortController();
    let Timeout = setTimeout(() => {
        // Abort.abort();
        // CallBack();
        // ErrorCallback();
        // ShowError("Request timeout");
    }, 3000);
    await fetch("/" + Action, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        signal: Abort.signal,
        body: JSON.stringify(Data)
    }).then(Response => {
        clearTimeout(Timeout);
        CallBack();
        if (Response.status == 200) {
            Response.json().then(Response => {
                if (Response.Success) {
                    SuccessCallback(Response.Data);
                } else {
                    ShowError(Response.Message);
                    FailCallback();
                }
            });
        } else {
            ShowError("Request failed: " + Response.status + " " + Response.statusText);
            ErrorCallback();
        }
    }).catch((Error) => {
        CallBack();
        ShowError("Request failed: " + Error);
        ErrorCallback();
    });
};
const SwitchPage = async (Path, Data = {}, PushState = true) => {
    if (PushState) {
        let URLPath = "index.html?Page=" + Path;
        for (let i in Data) {
            URLPath += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(Data[i]);
        }
        history.pushState({
            "Path": Path,
            "Data": Data
        }, Path, URLPath);
    }

    PageContent.innerHTML = "加载中……";

    await fetch(Path + ".html")
        .then((HTMLResponse) => {
            return HTMLResponse.text();
        }).then(async (HTMLResponse) => {
            await fetch(Path + ".js")
                .then((JSResponse) => {
                    return JSResponse.text();
                }).then((JSResponse) => {
                    PageContent.innerHTML = HTMLResponse;
                    Data = Data;
                    eval(JSResponse);
                });
        });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ShowModal = (Title, Body, PrimaryButtonOnClick, SecondaryButtonOnClick, PrimaryButtonColor = "danger", SecondaryButtonColor = "secondary") => {
    let Modal = document.createElement("div"); document.body.appendChild(Modal);
    Modal.id = "Modal";
    Modal.classList.add("modal");
    Modal.classList.add("fade");
    Modal.setAttribute("data-bs-backdrop", "static");
    Modal.setAttribute("data-bs-keyboard", "false");
    Modal.tabIndex = "-1";
    {
        let ModalDialog = document.createElement("div"); Modal.appendChild(ModalDialog);
        ModalDialog.classList.add("modal-dialog");
        {
            let ModalContent = document.createElement("div"); ModalDialog.appendChild(ModalContent);
            ModalContent.classList.add("modal-content");
            {
                let ModalHeader = document.createElement("div"); ModalContent.appendChild(ModalHeader);
                ModalHeader.classList.add("modal-header");
                {
                    let ModalTitle = document.createElement("h1"); ModalHeader.appendChild(ModalTitle);
                    ModalTitle.classList.add("modal-title");
                    ModalTitle.classList.add("fs-5");
                    ModalTitle.innerText = Title;
                }
                let ModalBody = document.createElement("div"); ModalContent.appendChild(ModalBody);
                ModalBody.classList.add("modal-body");
                ModalBody.innerHTML = Body;
                let ModalFooter = document.createElement("div"); ModalContent.appendChild(ModalFooter);
                ModalFooter.classList.add("modal-footer");
                {
                    let SecondaryButton = document.createElement("button"); ModalFooter.appendChild(SecondaryButton);
                    SecondaryButton.classList.add("btn");
                    SecondaryButton.classList.add("btn-" + SecondaryButtonColor);
                    SecondaryButton.type = "button";
                    SecondaryButton.setAttribute("data-bs-dismiss", "modal");
                    SecondaryButton.innerText = "No";
                    SecondaryButton.onclick = () => {
                        SecondaryButtonOnClick();
                        setTimeout(() => {
                            Modal.remove();
                        }, 500);
                    };
                    let PrimaryButton = document.createElement("button"); ModalFooter.appendChild(PrimaryButton);
                    PrimaryButton.classList.add("btn");
                    PrimaryButton.classList.add("btn-" + PrimaryButtonColor);
                    PrimaryButton.type = "button";
                    PrimaryButton.setAttribute("data-bs-dismiss", "modal");
                    PrimaryButton.innerText = "Yes";
                    PrimaryButton.onclick = () => {
                        PrimaryButtonOnClick();
                        setTimeout(() => {
                            Modal.remove();
                        }, 500);
                    }
                }
            }
        }
    }
    let ModalInstance = new bootstrap.Modal(Modal);
    ModalInstance.show();
}
const ShowAlert = (Text, Type) => {
    for (var i = 0; i < AlertList.children.length; i++) {
        if (AlertList.children[i].innerText == Text) {
            AlertList.children[i].remove();
        }
    }
    var Alert = document.createElement("div"); AlertList.appendChild(Alert);
    Alert.classList.add("alert");
    Alert.classList.add("alert-" + Type);
    Alert.classList.add("alert-dismissible");
    Alert.style.width = "400px";
    Alert.innerHTML = Text;
    {
        var CloseButton = document.createElement("button"); Alert.appendChild(CloseButton);
        CloseButton.classList.add("btn-close");
        CloseButton.type = "button";
        CloseButton.onclick = () => {
            Alert.remove();
        };
    }
    setTimeout(() => {
        Alert.remove();
    }, 3000);
};
const ShowError = (Text) => {
    ShowAlert(Text, "danger");
};
const ShowSuccess = (Text) => {
    ShowAlert(Text, "success");
};
const ShowToast = (Title, Body, Small = "") => {
    let Toast = document.createElement("div"); ToastList.appendChild(Toast);
    Toast.classList.add("toast");
    Toast.classList.add("m-3");
    Toast.role = "alert";
    {
        let ToastHeader = document.createElement("div"); Toast.appendChild(ToastHeader);
        ToastHeader.classList.add("toast-header");
        {
            let ToastTitle = document.createElement("strong"); ToastHeader.appendChild(ToastTitle);
            ToastTitle.classList.add("me-auto");
            ToastTitle.innerHTML = Title;
            let ToastSmall = document.createElement("small"); ToastHeader.appendChild(ToastSmall);
            ToastSmall.innerHTML = Small;
            let ToastClose = document.createElement("button"); ToastHeader.appendChild(ToastClose);
            ToastClose.type = "button";
            ToastClose.classList.add("btn-close");
            ToastClose.setAttribute("data-bs-dismiss", "toast");
        }
    }
    {
        let ToastBody = document.createElement("div"); Toast.appendChild(ToastBody);
        ToastBody.classList.add("toast-body");
        ToastBody.innerHTML = Body;
    }
    bootstrap.Toast.getOrCreateInstance(Toast).show();
}
const AddLoading = (Element) => {
    Element.disabled = true;
    let Loading = document.createElement("span"); Element.appendChild(Loading);
    Loading.classList.add("ms-2");
    Loading.classList.add("spinner-border");
    Loading.classList.add("spinner-border-sm");
    Loading.role = "status";
};
const RemoveLoading = (Element) => {
    Element.disabled = false;
    if (Element.lastChild.classList.contains("spinner-border"))
        Element.removeChild(Element.lastChild);
};
const SetValid = (Element, Valid = null) => {
    Element.classList.remove("is-valid");
    Element.classList.remove("is-invalid");
    if (Valid === true) {
        Element.classList.add("is-valid");
    }
    else if (Valid === false) {
        Element.classList.add("is-invalid");
    }
}
const CreatePlaceHolder = () => {
    let PlaceHolder = document.createElement("span");
    PlaceHolder.classList.add("placeholder");
    PlaceHolder.classList.add("col-" + (Math.floor(Math.random() * 12) + 1));
    return PlaceHolder;
};
const CreateHorizontalLine = () => {
    let HorizontalLine = document.createElement("hr");
    HorizontalLine.classList.add("border");
    HorizontalLine.classList.add("border-2");
    HorizontalLine.classList.add("border-primary");
    HorizontalLine.classList.add("rounded");
    return HorizontalLine;
};

(() => {
    if (new URLSearchParams(location.search).get("Page") !== null) {
        let Data = {};
        for (let i of new URLSearchParams(location.search).entries()) {
            if (i[0] != "Page") {
                Data[i[0]] = i[1];
            }
        }
        SwitchPage(new URLSearchParams(location.search).get("Page"), Data, false);
    }
    else {
        SwitchPage("Home");
    }
})();
onpopstate = (Event) => {
    if (Event.isTrusted && Event.state != null) {
        SwitchPage(Event.state.Path, Event.state.Data, false);
    }
};
