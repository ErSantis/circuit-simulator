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
    if(symbol.type == "I" && symbol.value != undefined) context.fillStyle = "#ff0000";
    else if (highlight) context.strokeStyle = "#ff8833";
    else context.strokeStyle = "#000000";
    context.beginPath();
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

        context.arc(xToDevice(pt[0]), yToDevice(pt[1]), xToDevice(pt[0] + circle[2]) - xToDevice(pt[0]), amin, amax, true);
        context.stroke();
    }
    // draw a label for the value of the component
    var pt = this.objectToWorld(3.5, 3.5);
    if (this.value) {

        context.font = "10pt sans-serif"
        context.fillStyle = "#000000";
        if(symbol.type == "I"){
            context.font = "14pt comic-sans"
            context.fillStyle = "#ff0000";
            context.fillText(this.value+"A", xToDevice(pt[0]-2), yToDevice(pt[1]));
        } 
        else if (symbol.type == "R") {
            
            if (symbol.rotation == 1)
                context.fillText(this.value + "Ω", xToDevice(pt[0] - 9), yToDevice(pt[1]));
            else
                context.fillText(this.value + "Ω", xToDevice(pt[0]), yToDevice(pt[1]));
        }

        else if (symbol.type == "V") {
            if (this.rotation == 3) {
                context.fillText(this.value + "V", xToDevice(pt[0]), yToDevice(pt[1] + 2));
            } else {
                context.fillText(this.value + "V", xToDevice(pt[0]), yToDevice(pt[1]));
            }

        }
        else if (symbol.type == "I" && symbol.value != "Undefined")
            context.fillText(this.value + "A", xToDevice(pt[0] - 3), yToDevice(pt[1]));
        
        else if (symbol.type == "Amp"){
            context.fillText(this.value , xToDevice(pt[0]-4), yToDevice(pt[1]-3));
        }

    }
}

/* Checking if the mouse is inside the box. */
Component.prototype.inside = function (xWorld, yWorld) {
    return xWorld > this.box[0] && xWorld < this.box[1] && yWorld > this.box[2] && yWorld < this.box[3];
}
/* Creating a new object called ntensidad. */
Intensidad = function (x, y, value) {
    this.points = [[0, 0], [0, 0]];
    Component.call(this, x, y, 0)
    this.value = value
    this.type = "I"
}
Intensidad.prototype = new Component()
/* Checking if the mouse is inside the line. */
Intensidad.prototype.inside = function (xWorld, yWorld) {

    var wireInsideThreshold = 0.5
    var len = Math.sqrt(this.points[1][0] * this.points[1][0] + this.points[1][1] * this.points[1][1]);
    var invLen = 1. / len;
    var v1 = [xWorld - this.x, yWorld - this.y];
    var v2 = [this.points[1][0] * invLen, this.points[1][1] * invLen];
    var parallelDistance = Math.abs(v1[0] * v2[1] - v1[1] * v2[0]); // length of perpendicular segment i.e. distance from light containing segment
    var perpendicularDistance = (v1[0] * v2[0] + v1[1] * v2[1]); // projected point parameter
    return Math.abs(parallelDistance) < wireInsideThreshold && perpendicularDistance > .5 * wireInsideThreshold && perpendicularDistance < len - .5 * wireInsideThreshold
}

/* Creating a resistor symbol. */
ResistorSymbol = function (x, y, rotation, value) {
    /// connected points that look like a resistor
    this.points = [[0, 0], [2, 0], [2.5, -1], [3.5, 1], [4.5, -1], [5.5, 1], [6.5, -1], [7.5, 1], [8, 0], [10, 0]]
    Component.call(this, x, y, rotation)
    this.value = value
    this.type = "R"

}
ResistorSymbol.prototype = new Component()


/* Creating a new object called VSourceSymbol. */
VSourceSymbol = function (x, y, rotation, value) {
    this.points = [[0, -6], [0, -4], null, [0, 4], [0, 6], null, [0, -4], [0, -2], null, [-1, -3], [1, -3], null, [-1, 3], [1, 3], null, [-1.5, -2], [0, 1.5], [1.5, -2]];
    this.circles = [[0, 0, 4, 2 * Math.PI]]
    Component.call(this, x, y, rotation)
    this.value = value
    this.type = "V"
}
VSourceSymbol.prototype = new Component()

Ammeter = function (x, y, rotation) {
    this.circles = [[0, 0, 3, 2 * Math.PI]]
    Component.call(this, x, y, rotation)
    this.value = "A"
    this.type = "Amp"
}
Ammeter.prototype = new Component()
/* Creating a new object called WireSymbol. */
WireSymbol = function (x, y, x1, y1) {
    this.points = [[0, 0], [x1 - x, y1 - y]];
    Component.call(this, x, y, 0)
}
WireSymbol.prototype = new Component()
/* Checking if the mouse is inside the wire. */
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

/* Building a net. */
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
/**
 * It sends a POST request to the server with the branches of the circuit, and then it receives the
 * currents of the circuit and updates the values of the currents in the circuit
 */
function post() {
    fetch('https://geoexpofisica.herokuapp.com/circuit3', {
        method: "POST",
        body: JSON.stringify(this.branches),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
        .then(response => response.json())
        .then(json => {
            console.log(json)
            const intensidades = this.symbols.filter(symbol => symbol.type == "I");

            for (let i = 0; i < intensidades.length; i++) {
                intensidades[i].value = json[i].toFixed(2);
            }
        });

}
/* Updating the branches of the tree. */
function updateBranches() {

    this.branches[0] = [
        this.symbols[0].type, this.symbols[0].value,
        this.symbols[1].type, this.symbols[1].value]

    this.branches[1] = [
        this.symbols[2].type, this.symbols[2].value]

    this.branches[2] = [
        this.symbols[3].type, this.symbols[3].value,
        this.branches[4].type, this.symbols[4].value]

    this.branches[3] = [
        this.symbols[5].type, this.symbols[5].value,
        this.symbols[6].type, this.symbols[6].value]

    this.branches[4] = [
        this.symbols[7].type, this.symbols[7].value,
        this.symbols[8].type, this.symbols[8].value]
    this.branches[5] = [
        this.symbols[9].type, this.symbols[9].value,
        this.symbols[10].type, this.symbols[10].value]
    this.branches[6] = [
        this.symbols[11].type, this.symbols[11].value]
    this.branches[7] = [
        this.symbols[12].type, this.symbols[12].value,
        this.symbols[13].type, this.symbols[13].value,
        this.symbols[14].type, this.symbols[14].value,
        this.symbols[15].type, this.symbols[15].value]

}
/* Creating a schematic capture object. */
SchematicCapture = function () {
    this.symbols = new Array;
    this.branch = new Array;
    this.branches = new Array;

    // Branch 1
    this.symbols.push(new ResistorSymbol(-20, -14, 0, 47));
    this.symbols.push(new VSourceSymbol(-4, -14, 3, 12));
    this.symbols.push(new Ammeter(12, -14, 0));
    

    //Push to the branch
    this.branch.push(this.symbols[0].type, this.symbols[0].value);
    this.branch.push(this.symbols[1].type, this.symbols[1].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 2
    this.symbols.push(new ResistorSymbol(-20, -4, 1, 100));
    this.symbols.push(new Ammeter(-8, 8, 0));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[2].type, this.symbols[2].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 3
    this.symbols.push(new ResistorSymbol(-20, -14, 1, 10));
    this.symbols.push(new VSourceSymbol(-4, -24, 3, 9));
    this.symbols.push(new Ammeter(24, 2, 0));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[3].type, this.symbols[3].value);
    this.branch.push(this.symbols[4].type, this.symbols[4].value);

    //Push the branch to the branches   
    this.branches.push(this.branch);

    // Branch 4
    this.symbols.push(new VSourceSymbol(24, -8, 0, 10));
    this.symbols.push(new ResistorSymbol(2, 8, 0, 47));
    this.symbols.push(new Ammeter(-14, -24, 0));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[5].type, this.symbols[5].value);
    this.branch.push(this.symbols[6].type, this.symbols[6].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 5
    this.symbols.push(new ResistorSymbol(2, -4, 1, 100));
    this.symbols.push(new VSourceSymbol(2, 2, 2, 7));
    this.symbols.push(new Ammeter(34, 6, 0));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[7].type, this.symbols[7].value);
    this.branch.push(this.symbols[8].type, this.symbols[8].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 6
    this.symbols.push(new ResistorSymbol(2, -24, 0, 5));
    this.symbols.push(new ResistorSymbol(24, -14, 1, 100));
    this.symbols.push(new Ammeter(15, -24, 0));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[9].type, this.symbols[9].value);
    this.branch.push(this.symbols[10].type, this.symbols[10].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 7
    this.symbols.push(new ResistorSymbol(2, -14, 1, 10));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[11].type, this.symbols[11].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    // Branch 8
    this.symbols.push(new ResistorSymbol(-8, 18, 0, 5));
    this.symbols.push(new ResistorSymbol(14, 18, 0, 2));
    this.symbols.push(new VSourceSymbol(-14, 18, 1, 20));
    this.symbols.push(new VSourceSymbol(8, 18, 3, 15));

    //Push to the branch
    this.branch = new Array;
    this.branch.push(this.symbols[12].type, this.symbols[12].value);
    this.branch.push(this.symbols[13].type, this.symbols[13].value);
    this.branch.push(this.symbols[14].type, this.symbols[14].value);
    this.branch.push(this.symbols[15].type, this.symbols[15].value);

    //Push the branch to the branches
    this.branches.push(this.branch);

    //Wires
    this.symbols.push(new WireSymbol(-20, -24, -17, -24));
    this.symbols.push(new WireSymbol(-5, 8, 2, 8));
    this.symbols.push(new WireSymbol(-11, -24, -9, -24));
    this.symbols.push(new WireSymbol(-11, 8, -20, 8));
    this.symbols.push(new WireSymbol(-20, -4, -20, 8));
    this.symbols.push(new WireSymbol(24, -24, 18, -24)); //
    this.symbols.push(new WireSymbol(2, -14, 9, -14));
    this.symbols.push(new WireSymbol(15, -14, 24, -14));
    this.symbols.push(new WireSymbol(24, -2, 24, -1));
    this.symbols.push(new WireSymbol(24, 5, 24, 8));
    this.symbols.push(new WireSymbol(24, 8, 12, 8));

    this.symbols.push(new WireSymbol(-30, -14, -20, -14));
    this.symbols.push(new WireSymbol(-30, -14, -30, 18));
    this.symbols.push(new WireSymbol(34, 18, 24, 18));
    this.symbols.push(new WireSymbol(34, 18, 34, 9));
    this.symbols.push(new WireSymbol(34, -14, 34, 3));
    this.symbols.push(new WireSymbol(34, -14, 24, -14));
    this.symbols.push(new WireSymbol(-30, 18, -20, 18));

    //Intensidades
    this.symbols.push(new Intensidad(-17, -20, "I1"));
    this.symbols.push(new Intensidad(-39, 0, "I2"));
    this.symbols.push(new Intensidad(-20, 0, "I3"));
    this.symbols.push(new Intensidad(-16, -30, "I4"));
    this.symbols.push(new Intensidad(15, 4, "I5"));
    this.symbols.push(new Intensidad(4, -6, "I6"));
    this.symbols.push(new Intensidad(15, -30, "I7"));
    this.symbols.push(new Intensidad(4, -20, "I8"));

    

    this.button = document.getElementById("button");
    this.schematicCanvas = document.getElementById("schematic")
    this.schematicCanvas.schematicCapture = this;
    this.schematicCanvas.addEventListener("dblclick", schematicCaptureDoubleClick);
    this.schematicCanvas.addEventListener("mousedown", schematicCaptureMouseDown);
    this.schematicCanvas.addEventListener("mouseup", schematicCaptureMouseUp);
    this.schematicCanvas.addEventListener("mousemove", schematicCaptureMouseMove);
    this.button.addEventListener('click', () => {
        updateBranches.call(this)
        post.call(this);

    });

    document.addEventListener("keydown", schematicCaptureKeyDown);

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

/* A function that is called when a key is pressed. */
SchematicCapture.prototype.keyDown = function (event) {
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
    } else if (event.keyCode == 8) {
        event.preventDefault();
        return false;
    }
    return true;
}

/* A function that is called when the user double clicks on the canvas. */
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

/* A function that is called when the mouse is clicked. */
SchematicCapture.prototype.mouseDown = function (event) {
    fixEvent(event);
    this.eventX = this.snap(this.deviceToWorldX(event.offsetX));
    this.eventY = this.snap(this.deviceToWorldY(event.offsetY));
    this.dragging = true;
    if (!this.highlight) {
        this.wiring = true;
    }
}

/* Checking if the mouse is inside the symbol. */
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
        this.draw();
    }
}

/* Setting the dragging and wiring variables to false. */
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
        context.strokeStyle = "rgb(125, 206, 160)";
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
    
}