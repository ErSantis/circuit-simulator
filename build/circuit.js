//------------------------------------------------------------------------------------------
// Draw a graph (oscilloscope)
//------------------------------------------------------------------------------------------
function graph(tmin,tmax,labels,vals){
	var cv = document.getElementById("graph")
	if(cv){
		var context = cv.getContext("2d");

	    cv.width=$(cv).width();

		context.beginPath()
		var xmin=tmin
		var xmax=tmax
		var ymin=-5
		var ymax=5
		var width=590
		var height=500
		var colors=["#ffaaaa","#aaffaa","#aaaaff","#ffffaa"]
		var heightPerSignal=height/(vals.length-1);
		var xToDevice=function(x){return (x-xmin)/(xmax-xmin)*width};
		var yToDevice=function(y){return height-((y-ymin)/(ymax-ymin)*heightPerSignal+(set-1)*heightPerSignal);};
		//for(var x=xmin;x<xmax;x+=.1){
		context.strokeStyle="#aaaaaa";
		context.fillStyle = "rgba(30, 30, 30, 255)";
		context.fillRect(0, 0, width, height);
    

		context.font="12pt Arial";

		context.lineWidth="1";

		if(true) for(var set=1;set<vals.length;set++){
			var first=true;
			context.fillStyle = "rgba(200, 200, 200, 255)";
	   		context.beginPath()
			context.lineWidth="1";
			context.strokeStyle="rgba(80,80,80,50)";
			// Draw lower axis
			context.moveTo(xToDevice(xmin),yToDevice(0))
			context.lineTo(xToDevice(xmax),yToDevice(0))
			context.moveTo(xToDevice(0),yToDevice(ymin))
			context.lineTo(xToDevice(0),yToDevice(ymax))
			// Draw y axis lines
			dy=(ymax-ymin)/20
			for(var y=ymin;y<=ymax;y+=dy){
				context.moveTo(xToDevice(xmin),yToDevice(y))
				context.lineTo(xToDevice(xmax),yToDevice(y))
				
			}
			// Draw x axis lines
			dx=(xmax-xmin)/8
			for(var x=xmin;x<=xmax;x+=dx){
				context.moveTo(xToDevice(x),yToDevice(ymin))
				context.lineTo(xToDevice(x),yToDevice(ymax))
			}
			context.stroke()
			

			// Draw label
			context.textAlign='right'
			context.fillText(labels[set-1],xToDevice(xmax),yToDevice((ymin+ymax)/2))
			context.strokeStyle=colors[set-1]
			context.lineWidth="3";
			// Draw values
			context.beginPath()
			for(var idx=0;idx<vals[set].length;idx++){
				var x=vals[0][idx];
				var y=vals[set][idx+1];
				var xdev = (x-xmin)/(xmax-xmin)*width
				var ydev = height - ((y-ymin)/(ymax-ymin)*heightPerSignal+(set-1)*heightPerSignal);

				if(first){
					first=false;
					context.moveTo(xToDevice(x),yToDevice(y));
				}else{
					context.lineTo(xToDevice(x),yToDevice(y));
				}
			}
			context.stroke()
		}
		/// Draw separator lines and the axis labels
		for(var set=0;set<vals.length;set++){
			//context.strokeStyle="rgba(255,255,255,255)";
			context.strokeStyle="rgba(250,250,250,50)";
			context.lineWidth="2";
			context.beginPath();
			//console.log(xmin,xmax,ymin,ymax);
			context.moveTo(xToDevice(xmin),yToDevice(ymin));
			context.lineTo(xToDevice(xmax),yToDevice(ymin));
			context.stroke();
			context.textAlign='left'
			context.fillText(""+ymin,5,yToDevice(ymin)-3);
			context.fillText(""+ymax,5,yToDevice(ymax)+17);
		}
	}else{
		console.log("error!")
	}
}

//------------------------------------------------------------------------------------------
// Resistor Class
//------------------------------------------------------------------------------------------

function Resistor(node1,node2,R){
	this.node1=node1
	this.node2=node2
	this.oneOverR=R
}

Resistor.prototype.matrix=function(dt, time, system, vPrev, vOld){
	console.log()
	system.addToMatrix(this.node1,this.node1,this.oneOverR);
	system.addToMatrix(this.node1,this.node2,-this.oneOverR);
	system.addToMatrix(this.node2,this.node1,-this.oneOverR);
	system.addToMatrix(this.node2,this.node2,this.oneOverR);
	system.addToB(this.node1,-vPrev[this.node1]*this.oneOverR+vPrev[this.node2]*this.oneOverR);
	system.addToB(this.node2,+vPrev[this.node1]*this.oneOverR-vPrev[this.node2]*this.oneOverR);
}

//------------------------------------------------------------------------------------------
// Diode Class
//------------------------------------------------------------------------------------------

function Diode(node1,node2,D){
	this.node1=node1
	this.node2=node2
	//this.oneOverR=1.0/R
	this.n=1.5
	this.IS=1e-12;
	this.VT=.026
}


Diode.prototype.matrix=function(dt, time, system, vPrev, vOld){
	var n1=this.node1;
	var n2=this.node2;
    var denomInv=1./(this.n*this.VT);
	var value=this.IS*(Math.exp((vPrev[n1]-vPrev[n2])*denomInv)-1)
	var deriv=this.IS*(Math.exp((vPrev[n1]-vPrev[n2])*denomInv))*denomInv;
	system.addToMatrix(this.node1,this.node1,deriv);
	system.addToMatrix(this.node1,this.node2,-deriv);
	system.addToMatrix(this.node2,this.node1,-deriv);
	system.addToMatrix(this.node2,this.node2,deriv);
	system.addToB(this.node1,-value);
	system.addToB(this.node2,value);
}


//------------------------------------------------------------------------------------------
// Capacitor Class
//------------------------------------------------------------------------------------------
function Capacitor(node1,node2,C){
	this.node1=node1;
	this.node2=node2;
	this.C=C;
}

Capacitor.prototype.matrix=function(dt, time, system, vPrev, vOld){
	// i = C dv/dt ~= C (v(t+1)-v(t))/dt
	// i =  (v(node1,t)-v(node2,t)) - (v(node1,t-1) - v(node2,t-1)) * C/dt
	//  v(node1,t)-v(node2,t)  = v(node1,t-1) - v(node2,t-1) 
	cOverDt=this.C/dt;
	system.addToMatrix(this.node1,this.node1,cOverDt);
	system.addToMatrix(this.node1,this.node2,-cOverDt);
	system.addToB(this.node1,cOverDt*(+vOld[this.node1]-vOld[this.node2])
		- ( vPrev[this.node1]*cOverDt - vPrev[this.node2]*cOverDt
			));

	system.addToMatrix(this.node2,this.node1,-cOverDt);
	system.addToMatrix(this.node2,this.node2,cOverDt);
	system.addToB(this.node2,cOverDt*(-vOld[this.node1]+vOld[this.node2])
		- ( -vPrev[this.node1]*cOverDt + vPrev[this.node2]*cOverDt
			));
}

//------------------------------------------------------------------------------------------
// Voltage Class
//------------------------------------------------------------------------------------------

function Voltage(node1,nodeCurrent,node2,values){
	//this.volts=volts;
	this.node1=node1;
	this.nodeCurrent=nodeCurrent;
	this.node2=node2;
	var tokens=values.split(",")

	this.period=parseFloat(tokens[1])
	this.type=tokens[0]
	this.min=parseFloat(tokens[2])
	this.max=parseFloat(tokens[3])
}

Voltage.prototype.matrix=function(dt,time,system,vprev,vold){
	// the constraint that the voltage from node1 to node2 is 5
    system.addToMatrix(this.nodeCurrent,this.node1,1);
    system.addToMatrix(this.nodeCurrent,this.node2,-1);
    var v=0;
    if(this.type=="triangle"){
    	normTime=(time%this.period)/this.period;
    	if(normTime<.25) v=.5*(this.min+this.max)+2*normTime*(this.max-this.min);
    	else if(normTime<.75) v=this.max-(normTime-.25)*2*(this.max-this.min);
    	//else if(normTime<.75) v=-.5*(this.min+this.max);//-(normTime-.5)*(this.max-this.min);
    	else v=this.min+(normTime-.75)*2*(this.max-this.min);
    	//else if(normTime<.5) v=(.25*this.min+.75*this.max)-(normTime-.25)*(this.max-this.min);
    }else if(this.type=="square"){
    	v=this.min;
    	if( time%this.period>this.period*.5) v=this.max;
    }else if(this.type=="sin"){
    	v=(Math.sin(time*2*Math.PI/this.period)+1)*(this.max-this.min)*.5+this.min
    }
    system.addToB(this.nodeCurrent,v-(vprev[this.node1]-vprev[this.node2]));

    // nodeCurrent is the current through the voltage source. it needs to be added to the KVL of node 1 and node2
    system.addToMatrix(this.node1,this.nodeCurrent,-1);
    system.addToMatrix(this.node2,this.nodeCurrent,1);
    system.addToB(this.node1,vprev[this.nodeCurrent]);
    system.addToB(this.node2,-vprev[this.nodeCurrent]);
}

//------------------------------------------------------------------------------------------
// Matrix system solve system
//------------------------------------------------------------------------------------------
function System(N,ground){
	this.A=[];
	this.b=[];
	this.ground=ground;
	for(var i=0;i<N;i++){
		var row=[];
		for(var j=0;j<N;j++){
			row.push(0);
		}
		this.A.push(row);
		this.b.push(0);
	}
	this.A[ground][ground]=1
}

/// Contribute to a matrix entry additively (used by components)
System.prototype.addToMatrix=function(row,column,value){
    //console.log("row col val "+row+" "+column+" "+value)
	if(row != this.ground){
		this.A[row][column]+=value;
	}
}

/// Contribute to the right side of the matrix additively (used by components)
System.prototype.addToB=function(i,value){
	if(i != this.ground){
		this.b[i] += value;
	}
}


/// Debug a matrix by giving some html
System.prototype.buildString=function(nodeToName,vprev,vOld){
    //document.write("FDS")
    var N=this.A.length
    table="<table><tr>"
    for(var j=0;j<N;j++){
       table+="<th class='mat'>"+j+"</td>"
    }
    table+="<th>old</th><th>sol</th><th>prev</th><th>label</th><th>b</th></tr>"
    for(var i=0;i<N;i++){
        table+="<tr>"
        for(var j=0;j<N;j++){
           table+="<td class='mat'>"+this.A[i][j]+"</td>"
        }
        table+="<td class='unknown'>"
        table+= vOld[i];
        table+="</td><td class='unknown'>"
        if(this.solution) table+= this.solution[i]
        table+="</td><td class='unknown'>"
        table+= vprev[i];
        table+="</td><td class='unknown'>"
        table+=" "+nodeToName[i]
        table+="</td>"

        table+="<td class='rhs'>"+this.b[i]+"</td>"
        table+="</tr>"
    }
    table+="</table>"
    return table;
}

// Solve the system matrix using LU decomposition with pivoting
System.prototype.solve=function(){
	var N=this.b.length;
    var pivots=new Array;
    this.solution=new Array;
    var solution=this.solution;
    for(var k=0;k<N;k++){
        pivots[k]=k;
        solution[k]=k;
    }
    var A=this.A;
    var b=this.b;
	for(var k=0;k<N;k++){
        // find and swap max pivot
        pivotIndex=k;
		for(var d=k+1;d<N;d++) if(Math.abs(A[d][k]) > Math.abs(A[pivotIndex][k])) pivotIndex=d;
        // swap pivot
        var temp=pivots[k];
        pivots[k]=pivots[pivotIndex];
        pivots[pivotIndex]=temp;
        // swap row
        var tempA=A[k];
        A[k]=A[pivotIndex];
        A[pivotIndex]=tempA;
        var tempb=b[k];
        b[k]=b[pivotIndex];
        b[pivotIndex]=tempb;
        //document.write("k="+k+" pivot was "+pivotIndex+"<br>")
        //this.print()
        //console.log("pivot for "+k+" is "+maxcol)

        // Form the triangle
        for(var row=k+1;row<N;row++){
            //console.log("k="+k+" row="+row)
            rowMult = A[row][k] / A[k][k]
            for(var col=k;col<N;col++){
                A[row][col] -= A[k][col] * rowMult
            }
            b[row]-=rowMult*b[k]
        }
	}
	// Back substitute
    for(var row=N-1;row>=0;row--){
        for(var col=row+1;col<N;col++){
            b[row]-=A[row][col]*solution[col]
            A[row][col]=0
        }
        solution[row]=b[row]/A[row][row]
        A[row][row]=1
    }
    return solution;
}


//------------------------------------------------------------------------------------------
// Circuit system
//------------------------------------------------------------------------------------------

function Circuit(){
	this.nameToNode={};
	this.nodeToName={};
	this.components=[];
	this.num = 0
}

// Iterate through all components to make a matrix
Circuit.prototype.buildMatrix=function(vPrev,vOld,dt,time){
	var system=new System(this.num,this.ground);
    this.sys=system;
	for(var comp=0;comp<this.components.length;comp++){
		this.components[comp].matrix(dt,time,system,vPrev,vOld);
	}
}

// Allocate a given node name. Basically assign a row in the solution vector (number)
Circuit.prototype.allocNode=function(name){
    if(!(name in this.nameToNode)){
        var num=this.num;
        this.nameToNode[name]=num;
        this.nodeToName[num]=name;
        this.num++;
        if(name=="GND"){
        	this.ground=num;
        }
        return num;
    }else{
        return this.nameToNode[name];
    }
}

//------------------------------------------------------------------------------------------
// Component factories
//------------------------------------------------------------------------------------------

Circuit.prototype.addVoltage=function(name1,name2,value){
    n1=this.allocNode(name1)
    n12=this.allocNode("sourceCurrent"+this.num)
    n2=this.allocNode(name2)
    this.components.push(new Voltage(n1,n12,n2,value))
}

Circuit.prototype.addC=function(name1,name2,R){
	var n1=this.allocNode(name1)
	var n2=this.allocNode(name2);
	this.components.push(new Capacitor(n1,n2,R))
}

Circuit.prototype.addI=function(name1,name2,R){
	var n1=this.allocNode(name1)
	var n2=this.allocNode(name2);
	var ni=this.allocNode("inductorCurrent"+this.num);
		this.components.push(new Inductor(n1,n2,ni,R))
}

Circuit.prototype.addR=function(name1,name2,R){
	var n1=this.allocNode(name1)
	var n2=this.allocNode(name2);
	this.components.push(new Resistor(n1,n2,R))
}

Circuit.prototype.addD=function(name1,name2,D){
	var n1=this.allocNode(name1)
	var n2=this.allocNode(name2);
	this.components.push(new Diode(n1,n2,D))	
}

// Solve a circuit over time using transient analysis
Circuit.prototype.transient=function(timeDuration,dt,nodeNamesToCollect){
	var time=0;
	var sol=new Array;
	var vPrev=new Array;
	var solutionVariables=[new Array];
	// Setup variables
	var graphNode = new Array; // this.allocNode(nodeNamesToCollect)
	for(var v=0;v<nodeNamesToCollect.length;v++){
		graphNode[v] = this.allocNode(nodeNamesToCollect[v])
		solutionVariables.push(new Array);
	}
	// Zero out initial guess
	for(var i=0;i<this.num;i++){
		sol[i]=0;
		vPrev[i]=0;
	}
	// Solve loop
	var idx=0;
	var debug=false;
	while(time<timeDuration){
		if(debug) $("#rep").append("time "+time+"<br/>");
		if(debug && idx>30) break;
		for(var i=0;i<this.num;i++) vPrev[i]=sol[i];
		for(var newtonIteration=0;newtonIteration<100;newtonIteration++){
			this.buildMatrix(vPrev,sol,dt,time); //NOTE: sol is time n-1 (i.e. so time derivatives can be computed i.e. capacitors)
			this.solution=null;
			if(debug) $("#rep").append("newton iteration "+newtonIteration+"<br/>"+this.sys.buildString(this.nodeToName,vPrev,sol));
			var difference=this.sys.solve(); // NOTE: sol now is time n
			if(debug) $("#rep").append(this.sys.buildString(this.nodeToName,vPrev,sol));
			//document.write(this.sys.buildString(this.nodeToName));
			var maxDifference=0.;
			for(var i=0;i<this.num;i++){
				vPrev[i]+=difference[i];
				var absDiff=Math.abs(difference[i]);
				if(absDiff>maxDifference) maxDifference=absDiff;
			}
			if(absDiff<1e-5) break;
			if(isNaN(absDiff)) break;
		}
		for(var i=0;i<this.num;i++) sol[i]=vPrev[i];
		// collect data
		solutionVariables[0].push(time)
		for(var v=0;v<graphNode.length;v++){
			solutionVariables[v+1].push(sol[graphNode[v]]);
		}
		time+=dt;
		idx+=1;
	}
	console.log(solutionVariables)
	return solutionVariables;
};
