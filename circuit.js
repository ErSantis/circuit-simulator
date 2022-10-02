

//------------------------------------------------------------------------------------------
// Resistor Class
//------------------------------------------------------------------------------------------

function Resistor(node1,node2,R){
	this.node1=node1
	this.node2=node2
	this.oneOverR=1.0/R
}

Resistor.prototype.matrix=function(dt, time, system, vPrev, vOld){
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
// Inductor Class
//------------------------------------------------------------------------------------------
function Inductor(node1,node2,nodeI,L){
	this.node1=node1;
	this.node2=node2;
	this.nodeI=nodeI;
	this.L=L;
}

Inductor.prototype.matrix=function(dt, time, system, vPrev, vOld){
	// v = L di/dt
	// v1-v2 = L di/dt
	// v1-v2 = (i-iold) L/dt
	// i L/dt + v2 - v1 = iold L/dt
	var L_div_dt=this.L/dt;
	system.addToMatrix(this.node1,this.nodeI,1);
	system.addToB(this.node1,-vPrev[this.nodeI]);
	system.addToMatrix(this.node2,this.nodeI,-1);
	system.addToB(this.node2,vPrev[this.nodeI]);

	system.addToMatrix(this.nodeI,this.nodeI,L_div_dt);
	system.addToMatrix(this.nodeI,this.node1,-1);
	system.addToMatrix(this.nodeI,this.node2,1);
	system.addToB(this.nodeI,(vOld[this.nodeI])*0-(-vPrev[this.node1]+vPrev[this.node2]+L_div_dt*(vPrev[this.nodeI]-vOld[this.nodeI])));
	//system.addToB(this.nodeI,-vPrev[this.node1]+vPrev[this.node2]+L_div_dt*(vPrev[this.nodeI]-vOld[this.nodeI])));
	//system.addToB(this.nodeI,-L_div_dt*vOld[this.nodeI]);
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

