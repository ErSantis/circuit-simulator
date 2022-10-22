    // Construct a component at a given position and rotation
Component = function(x,y,rotation){
    this.x = x; // xlocation of origin in world space
    this.y = y; // ylocation of origin in world space
    this.rotation = rotation; // 0 to 2
    this.updateBox();
}

/// Add a fractional position to the component
Component.prototype.addOffset=function(x,y){
    this.x+=x;
    this.y+=y;
    this.updateBox()
}

/// Update the bounding box in world-space given the current location and rotation
Component.prototype.updateBox=function(){
    // compute the bounding box
    this.box = [1e7,-1e7,1e7,-1e7];
    for(var ptK in this.points){
        var pt = this.points[ptK];
        if(!pt) continue;
        var pt = this.objectToWorld(pt[0],pt[1]);
        this.box[0]=Math.min(this.box[0],pt[0]);
        this.box[1]=Math.max(this.box[1],pt[0]);
        this.box[2]=Math.min(this.box[2],pt[1]);
        this.box[3]=Math.max(this.box[3],pt[1]);
    }
    for(var circleK in this.circles){
        var circle=this.circles[circleK];
        var pt=this.objectToWorld(circle[0],circle[1]);
        this.box[0]=Math.min(this.box[0],pt[0]-circle[2]);
        this.box[1]=Math.max(this.box[1],pt[0]+circle[2]);
        this.box[2]=Math.min(this.box[2],pt[1]-circle[2]);
        this.box[3]=Math.max(this.box[3],pt[1]+circle[2]);
    }
}

// Transform from object space to world space a point x,y
Component.prototype.objectToWorld=function(x,y){
    if(this.rotation==0) return [x+this.x,y+this.y];
    else if(this.rotation==1) return [this.x+y,this.y-x];
    else if(this.rotation==2) return [this.x-x,this.y-y];
    else if(this.rotation==3) return [this.x-y,this.y+x];
}

// Draw a component at a given location
Component.prototype.draw=function(xToDevice,yToDevice,context,highlight){
    if(highlight) context.strokeStyle = "#ff8833";
    else context.strokeStyle = "#000000";
    context.beginPath();
    //var points=[[0,-1],[0,0],[2,0],[2.5,-1],[3.5,1],[4.5,-1],[5.5,1],[6.5,-1],[7.5,1],[8,0],[10,0]]
    var first=true; // first point has to be a moveTo
    for(var dummy in this.points){
        var ptOrig=this.points[dummy];
        // check if we are at a null point and reset the draw count
        if(ptOrig == null){first = true;continue;}
        // transform the point into world device coordinates
        var pt=this.objectToWorld(ptOrig[0],ptOrig[1]);
        if(first){
            context.moveTo(xToDevice(pt[0]),yToDevice(pt[1]));
            first=false;
        }else{
            context.lineTo(xToDevice(pt[0]),yToDevice(pt[1]));
        }
    }
    context.stroke();
    for(var dummy in this.circles){
        var circle=this.circles[dummy];
        var pt=this.objectToWorld(circle[0],circle[1]);
        context.beginPath();
        var amax=circle[3];var amin=0;
        amin+=this.rotation*Math.PI/2;
        amax+=this.rotation*Math.PI/2;
        context.arc(xToDevice(pt[0]),yToDevice(pt[1]),xToDevice(pt[0]+circle[2])-xToDevice(pt[0]),amin,amax,true);
        context.stroke();
    }
    // draw a label for the value of the component
    var pt=this.objectToWorld(3.5,-3.5);
    if(this.value){
        context.font = "10pt sans-serif"
        context.fillStyle = "#000000";
        context.fillText(this.value,xToDevice(pt[0]),yToDevice(pt[1]));
    }
    if(false){ // draw bounding boxes
        context.strokeStyle="#aaaaaa"
        context.beginPath()
        context.moveTo(xToDevice(this.box[0]),yToDevice(this.box[2]))
        context.lineTo(xToDevice(this.box[1]),yToDevice(this.box[2]))
        context.lineTo(xToDevice(this.box[1]),yToDevice(this.box[3]))
        context.lineTo(xToDevice(this.box[0]),yToDevice(this.box[3]))
        context.lineTo(xToDevice(this.box[0]),yToDevice(this.box[2]))
        context.stroke()
    }
}

Component.prototype.buildNet=function(recordNet,unionNet)
{}

Component.prototype.inside=function(xWorld,yWorld){
    return xWorld > this.box[0] && xWorld < this.box[1] && yWorld > this.box[2] && yWorld < this.box[3];
}

ResistorSymbol =  function(x,y,rotation,value){
    /// connected points that look like a resistor
    this.points=[[0,0],[2,0],[2.5,-1],[3.5,1],[4.5,-1],[5.5,1],[6.5,-1],[7.5,1],[8,0],[10,0]]
    Component.call(this,x,y,rotation)
    this.value = value
}
ResistorSymbol.prototype = new Component()
ResistorSymbol.prototype.buildNet=function(recordNet,unionNet)
{
    var n1=recordNet(this.objectToWorld(0,0));
    var n2=recordNet(this.objectToWorld(10,0));
    return ["R",[n1,n2],this.value];
}

CapSymbol =  function(x,y,rotation,val){
    this.points=[[0,0],[4.5,0],[4.5,-2],[4.5,2],[4.5,0],null,[5.5,0],[5.5,-2],[5.5,2],[5.5,0],[10,0]];
    Component.call(this,x,y,rotation)
    this.value = ""+val
}
CapSymbol.prototype = new Component()
CapSymbol.prototype.buildNet=function(recordNet,unionNet)
{
    var n1=recordNet(this.objectToWorld(0,0));
    var n2=recordNet(this.objectToWorld(10,0));
    return ["C",[n1,n2],this.value];
}

VSourceSymbol = function(x,y,rotation,value){
    this.points=[[0,-6],[0,-4],null,[0,4],[0,6],null,[0,-4],[0,-2],null,[-1,-3],[1,-3],null,[-1,3],[1,3],null,[-1.5,-2],[0,1.5],[1.5,-2]];
    this.circles=[[0,0,4,2*Math.PI]]
    Component.call(this,x,y,rotation)
    this.value = value
}
VSourceSymbol.prototype = new Component()
VSourceSymbol.prototype.buildNet=function(recordNet,unionNet)
{
    var n1=recordNet(this.objectToWorld(0,-6));
    var n2=recordNet(this.objectToWorld(0,6));
    return ["V",[n1,n2],this.value]
}

DiodeSymbol = function(x,y,rotation,val){
    this.points=[[-2,0],[2,0],[2,1.5],[2,-1.5],[4,0],[2,1.5],[4,0],[4,1.5],[4,-1.5],[4,0],[8,0]]
    Component.call(this,x,y,rotation)
    this.value =val
}
DiodeSymbol.prototype = new Component()
DiodeSymbol.prototype.buildNet=function(recordNet,unionNet)
{
    var n1=recordNet(this.objectToWorld(-2,0));
    var n2=recordNet(this.objectToWorld(8,0));
    return ["D",[n1,n2],this.value]
}

WireSymbol = function(x,y,x1,y1){
    this.points=[[0,0],[x1-x,y1-y]];
    Component.call(this,x,y,0)
}
WireSymbol.prototype = new Component()
WireSymbol.prototype.inside=function(xWorld,yWorld){
    // v1 is vector from first point of wire to the cursor position
    // v2 is the vector from the first point to the second wire normalized
    // dotProduct(v1,v2) = cos(theta) |v1| |v2| = cos(theta) |v1|  must be in the interval [-threshold,v1+threhsold]
    // crossProduct(v1,v2) = sin(theta) |v1| |v2| = sin(theta) |v1| must be within [-threhsold,|v1|+threshold]
    var wireInsideThreshold = 0.5
    var len=Math.sqrt(this.points[1][0]*this.points[1][0]+this.points[1][1]*this.points[1][1]);
    var invLen=1./len;
    var v1=[xWorld-this.x,yWorld-this.y];
    var v2=[this.points[1][0]*invLen,this.points[1][1]*invLen];
    var parallelDistance=Math.abs(v1[0]*v2[1]-v1[1]*v2[0]); // length of perpendicular segment i.e. distance from light containing segment
    var perpendicularDistance=(v1[0]*v2[0]+v1[1]*v2[1]); // projected point parameter
    return Math.abs(parallelDistance) < wireInsideThreshold && perpendicularDistance > .5*wireInsideThreshold && perpendicularDistance < len-.5*wireInsideThreshold
}
WireSymbol.prototype.updateSecondPoint=function(x,y){
    this.points[1][0]=x-this.x;
    this.points[1][1]=y-this.y;
    this.updateBox();
}
WireSymbol.prototype.buildNet=function(netRecord,unionNet){
    var n0 = netRecord(this.objectToWorld(this.points[0][0],this.points[0][1]));
    var n1 = netRecord(this.objectToWorld(this.points[1][0],this.points[1][1]));
    unionNet(n0,n1);
}

GroundSymbol = function(x,y){
    this.points=[[0,-2],[0,0],null,[-3,0],[3,0],null,[-2,1],[2,1],null,[-1,2],[1,2]]
    Component.call(this,x,y,0)
}
GroundSymbol.prototype = new Component()
GroundSymbol.prototype.buildNet=function(netRecord,unionNet){
    var net=netRecord(this.objectToWorld(this.points[0][0],this.points[0][1]));
    unionNet(net,"GND")
}

function schematicCaptureDoubleClick(event){
    event.target.schematicCapture.doubleClick(event)
}
function schematicCaptureMouseDown(event){
    event.target.schematicCapture.mouseDown(event)
}
function schematicCaptureMouseUp(event){
    event.target.schematicCapture.mouseUp(event)
}
function schematicCaptureMouseMove(event){
    event.target.schematicCapture.mouseMove(event)
}
function schematicCaptureKeyDown(event){
    return document.getElementById("schematic").schematicCapture.keyDown(event)
}
SchematicCapture =  function(){
    this.symbols = new Array;

    // basic diff/integrator
    this.symbols.push(new VSourceSymbol(0,-4,0,"square,.3,0,5"));
    this.symbols.push(new ResistorSymbol(20,-10,0,100));
    
    this.symbols.push(new CapSymbol (30,-10,0,.0001));
    this.symbols.push(new GroundSymbol(40,-8,20,0));
    this.symbols.push(new WireSymbol(0,-10,20,-10));
    this.symbols.push(new WireSymbol(0,-20,20,-20));
    this.symbols.push(new WireSymbol(0,-20,0,-10));
    this.symbols.push(new WireSymbol(40,-20,40,-10));
    this.symbols.push(new ResistorSymbol(30,-20,0,200));
    //this.symbols.push(new CapSymbol (20,-20,0,.000001));
    this.symbols.push(new DiodeSymbol (22,-20,0,.000001));
    this.symbols.push(new GroundSymbol(0,4,20,0));


    this.schematicCanvas = document.getElementById("schematic")
    this.schematicCanvas.schematicCapture = this;
    this.schematicCanvas.addEventListener("dblclick",schematicCaptureDoubleClick);
    this.schematicCanvas.addEventListener("mousedown",schematicCaptureMouseDown);
    this.schematicCanvas.addEventListener("mouseup",schematicCaptureMouseUp);
    this.schematicCanvas.addEventListener("mousemove",schematicCaptureMouseMove);
    document.addEventListener("keydown",schematicCaptureKeyDown);

 }

SchematicCapture.prototype.clear=function(){
    this.symbols=[];
    this.draw();
}

SchematicCapture.prototype.deviceToWorldX=function(xDevice){
    return xDevice/this.width*(this.xmax-this.xmin)+this.xmin
}

SchematicCapture.prototype.deviceToWorldY=function(yDevice){
    return yDevice/this.height*(this.ymax-this.ymin)+this.ymin
}

SchematicCapture.prototype.snap =  function(x){
    return Math.floor((x+.5)/this.dx)*this.dx;
}

function fixEvent(event){
    if(event.offsetX == undefined){
        var targetOffset=$(event.target).offset();
        event.offsetX = event.pageX - targetOffset.left;
        event.offsetY = event.pageY - targetOffset.top;
    }
}


SchematicCapture.prototype.keyDown =  function(event){
    //console.log(event.keyCode);
    //console.log("blah "+this.highlight)
    status=$("#dialog")[0].style.display;
    console.log("status is '"+status+"'")
    if( status!="none" && status != ""){
        if(event.keyCode==13){
            $("#dialog")[0].editBack.value=$("#editValue")[0].value;
            this.draw();
            $("#dialog").hide();
            return false;
        }else if(event.keyCode==27){
            $("#dialog").hide();
            return false;
        }
    }else if(this.highlight){
        if(event.keyCode==8){ // delete
            var index=this.symbols.indexOf(this.highlight);
            this.symbols.splice(index,1);
            event.preventDefault();
            this.draw();
            return false;
        }else if(event.keyCode==82){ // r
            this.highlight.rotation=(this.highlight.rotation+1)%4
            this.highlight.updateBox();
            event.preventDefault();
            this.draw();
            return false;
        }
    }else if(event.keyCode==8){
        event.preventDefault();
        return false;
    }
    return true;
}


SchematicCapture.prototype.doubleClick =  function(event){
    fixEvent(event);
    if(this.highlight){
        $("#dialog").slideDown()

        $("#dialog")[0].editBack=this.highlight
        $("#dialog").css({left:event.offsetX,top:event.offsetY})
        $("#editValue").focus()
        $("#editValue")[0].value=(this.highlight.value)
    }
}

SchematicCapture.prototype.mouseDown =  function(event){
    fixEvent(event);
    this.eventX = this.snap(this.deviceToWorldX(event.offsetX));
    this.eventY = this.snap(this.deviceToWorldY(event.offsetY));
    this.dragging = true;
    if(!this.highlight){
        this.wiring = true;
        var symbol=new WireSymbol(this.snap(this.eventX),this.snap(this.eventY),this.snap(this.eventX),this.snap(this.eventY));
        this.symbols.push(symbol)
        this.wiring=symbol;
    }
}

SchematicCapture.prototype.mouseMove =  function(event){
    fixEvent(event);
    var newXraw = this.deviceToWorldX(event.offsetX);
    var newYraw = this.deviceToWorldY(event.offsetY);
    var newX = this.snap(newXraw);
    var newY = this.snap(newYraw);
    if(this.eventX == null || this.eventY == null){
        this.eventX=newX;
        this.eventY=newY;   
    }
    var offX = newX - this.eventX;
    var offY = newY - this.eventY;
    this.eventX = newX;
    this.eventY = newY;

    if(this.dragging){
        if(this.highlight){
            this.highlight.addOffset(offX,offY)
            this.draw()
        }else if(this.wiring){
            this.wiring.updateSecondPoint(this.snap(this.eventX),this.snap(this.eventY));
            this.draw();
        }
    }else{
        var oldHighlight = this.highlight;
        this.highlight=null;
        for(var v in this.symbols){
            var symbol=this.symbols[v];
            if(symbol.inside(newXraw,newYraw)){
                this.highlight=symbol;
            }
        }
        if(this.highlight != oldHighlight) this.draw();
    }
}

SchematicCapture.prototype.mouseUp =  function(event){
    if(this.wiring){
        if(this.wiring.points[1][0]==0 && this.wiring.points[1][1]==0){
            this.symbols.pop(); // remove zero length wire
        }
    }
    this.dragging=false;
    this.wiring=null;
}

SchematicCapture.prototype.addComponent = function(componentType,x,y){
    var newGuy=null;
    var canvasPos=$(this.schematicCanvas).position()
    var xDevice=x-canvasPos.left;
    var yDevice=y-canvasPos.top+60;
    var xWorld=this.snap(this.deviceToWorldX(xDevice));
    var yWorld=this.snap(this.deviceToWorldY(yDevice));
    this.eventX=null;
    this.eventy=null;
    
    switch(componentType){
        case "resistor": newGuy=new ResistorSymbol(xWorld,yWorld,0,1000);break;
        case "capacitor": newGuy=new CapSymbol(xWorld,yWorld,0,0.001);break;
        case "diode": newGuy=new DiodeSymbol(xWorld,yWorld,0);break;
        case "vSource": newGuy=new VSourceSymbol(xWorld,yWorld,0,"square,.3,0,5");break;
        case "ground": newGuy=new GroundSymbol(xWorld,yWorld,0);break;
        default: return;
    }
    this.symbols.push(newGuy)
    this.highlight=newGuy
    this.dragging=true;
    this.draw()
}

SchematicCapture.prototype.buildNet = function(){
    var netNodes = {};
    var that=this;
    var nodeName=function(pt){
        return Math.floor(pt[0]/that.dx)+","+Math.floor(pt[1]/that.dx);
    };
    var findRoot=function(x){
        while(netNodes[x][3] != x) x=netNodes[x][3];
        return x;
    }
    var counter=0;
    netNodes["GND"]=[undefined,undefined,0,"GND"];
    var netRecord=function(pt){
        var name=nodeName(pt);
        if(netNodes[name]==undefined){
            //var canonical="n"+counter;
            //netNodes[canonical]=[-1000,-1000,0,canonical];
            netNodes[name]=[pt[0],pt[1],0,name];
            counter++;
        }
        netNodes[name][2]++;
        return findRoot(name)
    }
    var unionNet=function(name1,name2){
        if(name1 == "GND")  netNodes[name2][3]=name1;
        else netNodes[name1][3]=name2;
        //netNodes[name1][3]=name2;
    }
    //console.log("hi:" +nodeName([3,4]))

    var components=[];
    for(var x in this.symbols){
        var symbol = this.symbols[x];
        var symbolRep=symbol.buildNet(netRecord,unionNet);
        if(symbolRep) components.push(symbolRep);
    }
    /// Get a list of active names
    var activeNames={};
    for(var n in netNodes){
        var name=findRoot(n);
        activeNames[name]=1;
    }

    /// now union find lookup
    for(var item in components){
        var nodes=components[item][1]
        for(var node in nodes){
            nodes[node]=findRoot(nodes[node]);
        }
    }
    text="<b>Simulation List</b><br/>"
    for(var x in components){
        text+=JSON.stringify(components[x])+"<br/>"
    }
    $("#rep").html(text)
    createCircuitFromNetList(activeNames,components);


    return netNodes;
}

var circuit=null;
function createCircuitFromNetList(names,components){
    circuit=new Circuit();
    // Make a list of all the voltage nodes to graph
    namesToGraph=[]
    for(var n in names) namesToGraph.push(n);
    // Take visual components and turn them into simulation components
    for(var n in components){
        var node=components[n];
        switch(node[0]){
            case "R": circuit.addR(node[1][0],node[1][1],node[2]);break;
            case "C": circuit.addC(node[1][0],node[1][1],node[2]);break;
            case "V": circuit.addVoltage(node[1][0],node[1][1],node[2]);break;
            case "D": circuit.addD(node[1][0],node[1][1],node[2]);break;
            case "L": circuit.addI(node[1][0],node[1][1],node[2]);break;
        }
    }
    // solve and graph the circuit
    var foo=circuit.transient(3.0,.001,namesToGraph);
    graph(0,2,namesToGraph,foo);
}

SchematicCapture.prototype.draw =  function(){
    this.width=$(this.schematicCanvas).width();
    this.height=$(this.schematicCanvas).height();
    this.schematicCanvas.width=this.width;
    this.schematicCanvas.height=this.height;
    this.scale=.15;
    this.xmin=-50;
    this.xmax=this.width*this.scale+this.xmin;
    this.ymin=-50;
    this.ymax=(this.xmax-this.xmin)/this.width*this.height+this.ymin
    /// xlen / width = ylen / height
    this.dx=2;
    var schem = this.schematicCanvas;
    schem.width=schem.width;
    var context = schem.getContext("2d");
    context.beginPath()
    var self=this; // bind to outer scope
    var xToDevice=function(x){return (x-self.xmin)/(self.xmax-self.xmin)*self.width};
    var yToDevice=function(y){return (y-self.ymin)/(self.ymax-self.ymin)*self.height};
    // draw grid lines
    //context.fillStyle = "rgba(255, 255, 180, 255)";
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.fillRect(0, 0, this.width, this.height);
    if(true){
        context.strokeStyle = "rgb(125, 206, 160)";
        var xstart = Math.floor(this.xmin / this.dx) * this.dx;
        for(var x=xstart;x<this.xmax;x+=this.dx){
            context.moveTo(xToDevice(x),yToDevice(this.ymin));
            context.lineTo(xToDevice(x),yToDevice(this.ymax));

        }
        var ystart = Math.floor(this.ymin / this.dx) * this.dx;
        for(var y=ystart;y<this.ymax;y+=this.dx){
             context.moveTo(xToDevice(this.xmin),yToDevice(y));
             context.lineTo(xToDevice(this.xmax),yToDevice(y));
        }
    }
    context.stroke();

    // draw origin
    if(false){
        context.strokeStyle = "rgba(50,50,200, 255)";
        context.beginPath()
        context.moveTo(xToDevice(this.xmin),yToDevice(0))
        context.lineTo(xToDevice(this.xmax),yToDevice(0))
        context.moveTo(xToDevice(0),yToDevice(this.ymin))
        context.lineTo(xToDevice(0),yToDevice(this.ymax))
        context.stroke()
    }
    context.strokeStyle = "rgba(0,0,0, 1)";
    context.lineWidth = 2;
    // draw symbols
    for(var v in this.symbols){
        var symbol=this.symbols[v];
        symbol.draw(xToDevice,yToDevice,context,symbol==this.highlight);
    }
  
    // find all connection points so we can draw if connections happen
    var net=this.buildNet()
    context.strokeStyle = "rgba(0,0,0, 1)";
    for(var n in net){
        context.beginPath()
        var data=net[n];
        context.arc(xToDevice(data[0]),yToDevice(data[1]),4,0,2*Math.PI,true);
        if(data[2]>1)context.fill();
        else context.stroke();
    }
    // draw current mouse coords
    //context.fillText("x="+this.eventX+" y="+this.eventY,0,30)
// 
}