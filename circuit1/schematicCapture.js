// Construct a component at a given position and rotation
Component = function (x, y, rotation) {
    this.x = x; // xlocation of origin in world space
    this.y = y; // ylocation of origin in world space
    this.rotation = rotation; // 0 to 2
    this.updateBox();
}

/// Add a fractional position to the component
Component.prototype.addOffset = function (x, y) {
    this.x += x;
    this.y += y;
    this.updateBox()
}

/// Update the bounding box in world-space given the current location and rotation
Component.prototype.updateBox = function () {
    // compute the bounding box
    this.box = [1e7, -1e7, 1e7, -1e7];
    for (var ptK in this.points) {
        var pt = this.points[ptK];
        if (!pt) continue;
        var pt = this.objectToWorld(pt[0], pt[1]);
        this.box[0] = Math.min(this.box[0], pt[0]);
        this.box[1] = Math.max(this.box[1], pt[0]);
        this.box[2] = Math.min(this.box[2], pt[1]);
        this.box[3] = Math.max(this.box[3], pt[1]);
    }
    for (var circleK in this.circles) {
        var circle = this.circles[circleK];
        var pt = this.objectToWorld(circle[0], circle[1]);
        this.box[0] = Math.min(this.box[0], pt[0] - circle[2]);
        this.box[1] = Math.max(this.box[1], pt[0] + circle[2]);
        this.box[2] = Math.min(this.box[2], pt[1] - circle[2]);
        this.box[3] = Math.max(this.box[3], pt[1] + circle[2]);
    }
}

// Transform from object space to world space a point x,y
Component.prototype.objectToWorld = function (x, y) {
    if (this.rotation == 0) return [x + this.x, y + this.y];
    else if (this.rotation == 1) return [this.x + y, this.y - x];
    else if (this.rotation == 2) return [this.x - x, this.y - y];
    else if (this.rotation == 3) return [this.x - y, this.y + x];
}

// Draw a component at a given location
Component.prototype.draw = function (xToDevice, yToDevice, context, highlight, symbol) {
    if (highlight) context.strokeStyle = "#ff8833";
    else context.strokeStyle = "#000000";
    context.beginPath();
    //var points=[[0,-1],[0,0],[2,0],[2.5,-1],[3.5,1],[4.5,-1],[5.5,1],[6.5,-1],[7.5,1],[8,0],[10,0]]
    var first = true; // first point has to be a moveTo
    for (var dummy in this.points) {
        var ptOrig = this.points[dummy];
        // check if we are at a null point and reset the draw count
        if (ptOrig == null) { first = true; continue; }
        // transform the point into world device coordinates
        var pt = this.objectToWorld(ptOrig[0], ptOrig[1]);
        if (first) {
            context.moveTo(xToDevice(pt[0]), yToDevice(pt[1]));
            first = false;
        } else {
            context.lineTo(xToDevice(pt[0]), yToDevice(pt[1]));
        }
    }
    context.stroke();
    for (var dummy in this.circles) {
        var circle = this.circles[dummy];
        var pt = this.objectToWorld(circle[0], circle[1]);
        context.beginPath();
        var amax = circle[3]; var amin = 0;
        amin += this.rotation * Math.PI / 2;
        amax += this.rotation * Math.PI / 2;
        context.arc(xToDevice(pt[0]), yToDevice(pt[1]), xToDevice(pt[0] + circle[2]) - xToDevice(pt[0]), amin, amax, true);
        context.stroke();
    }
    // draw a label for the value of the component
    var pt = this.objectToWorld(3.5, 3.5);
    if (this.value) {
        context.font = "10pt sans-serif"
        context.fillStyle = "#000000";
        if (symbol.type == "R")
            context.fillText(this.value + "Ω", xToDevice(pt[0]), yToDevice(pt[1]));
        else if (symbol.type == "V")
            context.fillText(this.value + "V", xToDevice(pt[0]), yToDevice(pt[1]));
    }
}

Component.prototype.buildNet = function (recordNet, unionNet) { }

Component.prototype.inside = function (xWorld, yWorld) {
    return xWorld > this.box[0] && xWorld < this.box[1] && yWorld > this.box[2] && yWorld < this.box[3];
}

ResistorSymbol = function (x, y, rotation, value) {
    /// connected points that look like a resistor
    this.points = [[0, 0], [2, 0], [2.5, -1], [3.5, 1], [4.5, -1], [5.5, 1], [6.5, -1], [7.5, 1], [8, 0], [10, 0]]
    Component.call(this, x, y, rotation)
    this.value = value
    this.type = "R"

}
ResistorSymbol.prototype = new Component()
ResistorSymbol.prototype.buildNet = function (recordNet, unionNet) {
    var n1 = recordNet(this.objectToWorld(0, 0));
    var n2 = recordNet(this.objectToWorld(10, 0));
    return ["R", [n1, n2], this.value];
}


VSourceSymbol = function (x, y, rotation, value) {
    this.points = [[0, -6], [0, -4], null, [0, 4], [0, 6], null, [0, -4], [0, -2], null, [-1, -3], [1, -3], null, [-1, 3], [1, 3], null, [-1.5, -2], [0, 1.5], [1.5, -2]];
    this.circles = [[0, 0, 4, 2 * Math.PI]]
    Component.call(this, x, y, rotation)
    this.value = value
    this.type = "V"
}
VSourceSymbol.prototype = new Component()
VSourceSymbol.prototype.buildNet = function (recordNet, unionNet) {
    var n1 = recordNet(this.objectToWorld(0, -6));
    var n2 = recordNet(this.objectToWorld(0, 6));
    return ["V", [n1, n2], this.value]
}

WireSymbol = function (x, y, x1, y1) {
    this.points = [[0, 0], [x1 - x, y1 - y]];
    Component.call(this, x, y, 0)
}
WireSymbol.prototype = new Component()
WireSymbol.prototype.inside = function (xWorld, yWorld) {

    var wireInsideThreshold = 0.5
    var len = Math.sqrt(this.points[1][0] * this.points[1][0] + this.points[1][1] * this.points[1][1]);
    var invLen = 1. / len;
    var v1 = [xWorld - this.x, yWorld - this.y];
    var v2 = [this.points[1][0] * invLen, this.points[1][1] * invLen];
    var parallelDistance = Math.abs(v1[0] * v2[1] - v1[1] * v2[0]); // length of perpendicular segment i.e. distance from light containing segment
    var perpendicularDistance = (v1[0] * v2[0] + v1[1] * v2[1]); // projected point parameter
    return Math.abs(parallelDistance) < wireInsideThreshold && perpendicularDistance > .5 * wireInsideThreshold && perpendicularDistance < len - .5 * wireInsideThreshold
}
WireSymbol.prototype.updateSecondPoint = function (x, y) {
    this.points[1][0] = x - this.x;
    this.points[1][1] = y - this.y;
    this.updateBox();
}
WireSymbol.prototype.buildNet = function (netRecord, unionNet) {
    var n0 = netRecord(this.objectToWorld(this.points[0][0], this.points[0][1]));
    var n1 = netRecord(this.objectToWorld(this.points[1][0], this.points[1][1]));
    unionNet(n0, n1);
}


function schematicCaptureDoubleClick(event) {
    event.target.schematicCapture.doubleClick(event)
}
function schematicCaptureMouseDown(event) {
    event.target.schematicCapture.mouseDown(event)
}
function schematicCaptureMouseUp(event) {
    event.target.schematicCapture.mouseUp(event)
}
function schematicCaptureMouseMove(event) {
    event.target.schematicCapture.mouseMove(event)
}
function schematicCaptureKeyDown(event) {
    return document.getElementById("schematic").schematicCapture.keyDown(event)
}
SchematicCapture = function () {
    this.symbols = new Array;

    this.branch = new Array;
    this.branches = new Array;

    // Branch 1, Create symbols
    this.symbols.push(new ResistorSymbol(-10, -10, 1, 3));
    this.symbols.push(new VSourceSymbol(-10, -4, 0, 10));

    //Push to the branch
    this.branch.push(this.symbols[0].type, this.symbols[0].value);
    this.branch.push(this.symbols[1].type, this.symbols[1].value);

    //Push branch to branches
    this.branches.push(this.branch);

    this.symbols.push(new WireSymbol(-10, -20, 10, -20));

    //Branch 2, Create symbols
    this.symbols.push(new ResistorSymbol(10, -10, 1, 10));
    this.symbols.push(new VSourceSymbol(10, -4, 0, 7));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[3].type, this.symbols[3].value);
    this.branch.push(this.symbols[4].type, this.symbols[4].value);

    //Push branch to branches
    this.branches.push(this.branch);

    this.symbols.push(new WireSymbol(10, -20, 30, -20));

    //Branch 3, Create symbols
    this.symbols.push(new ResistorSymbol(30, -10, 1, 2));
    this.symbols.push(new VSourceSymbol(30, -4, 0, 5));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[6].type, this.symbols[6].value);
    this.branch.push(this.symbols[7].type, this.symbols[7].value);

    //Push branch to branches
    this.branches.push(this.branch);

    console.log(this.branches)

    // Post branches
    post.call(this);

    this.symbols.push(new WireSymbol(-10, 2, 30, 2));

    this.schematicCanvas = document.getElementById("schematic")
    this.schematicCanvas.schematicCapture = this;
    this.schematicCanvas.addEventListener("dblclick", schematicCaptureDoubleClick);
    this.schematicCanvas.addEventListener("mousedown", schematicCaptureMouseDown);
    this.schematicCanvas.addEventListener("mouseup", schematicCaptureMouseUp);
    this.schematicCanvas.addEventListener("mousemove", schematicCaptureMouseMove);


    document.addEventListener("keydown", schematicCaptureKeyDown);
}   

function post() {
    fetch('http://localhost:5501/test', {
        method: "POST",
        body: JSON.stringify(this.branches),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
        .then(response => response.json())
        .then(json => console.log(json));
}


SchematicCapture.prototype.deviceToWorldX = function (xDevice) {
    return xDevice / this.width * (this.xmax - this.xmin) + this.xmin
}

SchematicCapture.prototype.deviceToWorldY = function (yDevice) {
    return yDevice / this.height * (this.ymax - this.ymin) + this.ymin
}

SchematicCapture.prototype.snap = function (x) {
    return Math.floor((x + .5) / this.dx) * this.dx;
}

function fixEvent(event) {
    if (event.offsetX == undefined) {
        var targetOffset = $(event.target).offset();
        event.offsetX = event.pageX - targetOffset.left;
        event.offsetY = event.pageY - targetOffset.top;
    }
}


SchematicCapture.prototype.keyDown = function (event) {
    //console.log(event.keyCode);
    //console.log("blah "+this.highlight)
    status = $("#dialog")[0].style.display;
    console.log("status is '" + status + "'")
    if (status != "none" && status != "") {
        if (event.keyCode == 13) {
            $("#dialog")[0].editBack.value = $("#editValue")[0].value;
            this.draw();
            $("#dialog").hide();
            return false;
        } else if (event.keyCode == 27) {
            $("#dialog").hide();
            return false;
        }
    } else if (this.highlight) {
        if (event.keyCode == 8) { // delete
            var index = this.symbols.indexOf(this.highlight);
            this.symbols.splice(index, 1);
            event.preventDefault();
            this.draw();
            return false;
        } else if (event.keyCode == 82) { // r
            this.highlight.rotation = (this.highlight.rotation + 1) % 4
            this.highlight.updateBox();
            event.preventDefault();
            this.draw();
            return false;
        }
    } else if (event.keyCode == 8) {
        event.preventDefault();
        return false;
    }
    return true;
}


SchematicCapture.prototype.doubleClick = function (event) {
    fixEvent(event);
    if (this.highlight) {
        $("#dialog").slideDown()
        $("#dialog")[0].editBack = this.highlight
        $("#dialog").css({ left: event.offsetX, top: event.offsetY })
        $("#editValue").focus()
        $("#editValue")[0].value = (this.highlight.value)
    }
}

SchematicCapture.prototype.mouseDown = function (event) {
    fixEvent(event);
    this.eventX = this.snap(this.deviceToWorldX(event.offsetX));
    this.eventY = this.snap(this.deviceToWorldY(event.offsetY));
    this.dragging = true;
    if (!this.highlight) {
        this.wiring = true
    }
}

SchematicCapture.prototype.mouseMove = function (event) {
    fixEvent(event);
    var newXraw = this.deviceToWorldX(event.offsetX);
    var newYraw = this.deviceToWorldY(event.offsetY);
    var newX = this.snap(newXraw);
    var newY = this.snap(newYraw);
    if (this.eventX == null || this.eventY == null) {
        this.eventX = newX;
        this.eventY = newY;
    }
    var offX = newX - this.eventX;
    var offY = newY - this.eventY;
    this.eventX = newX;
    this.eventY = newY;

    if (!this.dragging) {
        var oldHighlight = this.highlight;
        this.highlight = null;
        for (var v in this.symbols) {
            var symbol = this.symbols[v];
            if (symbol.inside(newXraw, newYraw)) {
                this.highlight = symbol;
            }
        }
        if (this.highlight != oldHighlight) {
            this.draw();
        }
    }
}

SchematicCapture.prototype.mouseUp = function (event) {

    this.dragging = false;
    this.wiring = null;
}

SchematicCapture.prototype.draw = function () {
    this.width = $(this.schematicCanvas).width();
    this.height = $(this.schematicCanvas).height();
    this.schematicCanvas.width = this.width;
    this.schematicCanvas.height = this.height;
    this.scale = .15;
    this.xmin = -50;
    this.xmax = this.width * this.scale + this.xmin;
    this.ymin = -50;
    this.ymax = (this.xmax - this.xmin) / this.width * this.height + this.ymin
    /// xlen / width = ylen / height
    this.dx = 2;
    var schem = this.schematicCanvas;
    schem.width = schem.width;
    var context = schem.getContext("2d");
    context.beginPath()
    var self = this; // bind to outer scope
    var xToDevice = function (x) { return (x - self.xmin) / (self.xmax - self.xmin) * self.width };
    var yToDevice = function (y) { return (y - self.ymin) / (self.ymax - self.ymin) * self.height };
    // draw grid lines
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.fillRect(0, 0, this.width, this.height);
    if (true) {
        context.strokeStyle = "rgb(159, 90, 253,0.3)";
        var xstart = Math.floor(this.xmin / this.dx) * this.dx;
        for (var x = xstart; x < this.xmax; x += this.dx) {
            context.moveTo(xToDevice(x), yToDevice(this.ymin));
            context.lineTo(xToDevice(x), yToDevice(this.ymax));

        }
        var ystart = Math.floor(this.ymin / this.dx) * this.dx;
        for (var y = ystart; y < this.ymax; y += this.dx) {
            context.moveTo(xToDevice(this.xmin), yToDevice(y));
            context.lineTo(xToDevice(this.xmax), yToDevice(y));
        }
    }
    context.stroke();

    context.strokeStyle = "rgba(0,0,0, 1)";
    context.lineWidth = 2;
    // draw symbols
    for (var v in this.symbols) {
        var symbol = this.symbols[v];
        symbol.draw(xToDevice, yToDevice, context, symbol == this.highlight, symbol);
    }
    post.call(this)

}