// constants ---------------------------------------------

// game state constants
const cGameStopped = 0;
const cGameStarted = 1;
const cGamePaused = 2;

const cMaxGameSpeed = 5;

//points
const T = "TopCenter";
const B = "BottomCenter";
const L = "LeftMiddle";
const R = "RightMiddle";


// globals -----------------------------------------------
var G_GAME_SPEED = 1;
var G_GAME_STATE = cGameStopped;
var G_NUM_TILES = 0;

var dev_base_rate = 0.1 //0.1 * experience
var qe_base_rate = 0.1
var xd_base_rate = 0.1
var manager_rate = 2 // increases total rate by 2

var TIME = 0;

// game settings -----------------------------------------
// 1 3 R L means: node1 - node3 connection is made from right of node1 to left of node2
// 6 is number of tiles
var game_connections = { 
            6: [[1,3,R,T],
			[2,3,R,L],
			[3,4,R,L],
			[3,5,B,L],
			[4,6,R,T],
			[5,6,R,L]],

            4    : [[1,2,R,L],
            [2,3,B,T],
            [3,4,R,L]],

            8    : [[1,3,R,L],
            [2,5,R,L],
            [3,6,R,L],
            [4,7,R,L],
            [7,8,B,T],
            [6,7,B,T],
            [5,4,T,B]],

            10    : [[1,3,R,L],
            [2,4,R,L],
            [4,5,B,T],
            [3,6,R,L],
            [5,8,R,L],
            [6,7,B,T],
            [7,9,R,T],  
            [8,9,R,L],
            [9,10,B,T]]
        };

// left and top positions of the window in %
// This specifies arrangements of each node. [5,10] means first node is 5% from left and 10% from top
var window_positions = {
                4 : [[10,30],
                 [40,10],       
                 [40,50],   
                 [70,30]],

                6: [[5,10],
			     [5,50],	
			     [30,25],	
			     [55,10],	
			     [55,50],	
			     [80,25]],

                8: [[5,20],
                 [5,60],    
                 [40,5],   
                 [40,45],   
                 [40,85],   
                 [75,5],
                 [75,45],
                 [75,85]],

                10: [[5,20],
                 [5,60],    
                 [30,5],   
                 [30,45],   
                 [30,85],   
                 [55,5],
                 [55,45],
                 [55,85],
                 [80,20],
                 [80,60]]
            };

// this should specify the requirement of each node.
// NOTE: add "locked":false to starting nodes
var levels = { 6 : [{"Dev":[20,20,60], "QE":30, "XD":30,"locked":false},
			{"Dev":[50,0,100], "QE":70,"XD":0,"locked":false},
			{"Dev":[20,10,0], "QE":100,"XD":0},
			{"Dev":[0,100,0], "QE":20, "XD":10},
			{"Dev":[10,10,100], "QE":0,"XD":20},
			{"Dev":[60,10,10], "QE":70,"XD":30}], 

            4 : [{"Dev":[70,10,10], "QE":20, "XD":30,"locked":false},
            {"Dev":[60,100,10], "QE":70,"XD":20},
            {"Dev":[70,100,10], "QE":80,"XD":0},
            {"Dev":[0,100,0], "QE":100, "XD":30}], 

            8 : [{"Dev":[10,0,50], "QE":30, "XD":20, "locked":false},
            {"Dev":[0,100,0], "QE":20,"XD":10,"locked":false},
            {"Dev":[30,10,0], "QE":0,"XD":0},
            {"Dev":[50,10,10], "QE":30, "XD":0},
            {"Dev":[20,0,100], "QE":20, "XD":0},
            {"Dev":[0,100,0], "QE":20, "XD":10},
            {"Dev":[0,0,100], "QE":50, "XD":20},
            {"Dev":[50,10,10], "QE":30,"XD":10}], 

            10 : [{"Dev":[10,0,50], "QE":30, "XD":20, "locked":false},
            {"Dev":[0,100,0], "QE":20,"XD":10,"locked":false},
            {"Dev":[30,10,0], "QE":0,"XD":0},
            {"Dev":[50,10,10], "QE":30, "XD":0},
            {"Dev":[20,0,100], "QE":20, "XD":0},
            {"Dev":[0,100,0], "QE":20, "XD":10},
            {"Dev":[0,0,100], "QE":50, "XD":20},
            {"Dev":[20,10,100], "QE":20, "XD":0},
            {"Dev":[50,10,0], "QE":50, "XD":10},
            {"Dev":[50,10,10], "QE":30,"XD":10}]

        }

// workers data is stored in this
var workers = {4:{},6:{},8:{},10:{}};

// people ------------------------------------------------
// Dev - DB, .NET, Web
// QE skills
// Manager Nos
// XD skills
var people = { "Dev" : [[20,100,50],[50,10,100],[10,10,10]], "QE" : [30,20,50], "Manager" : 1, "XD" : [20,10]}

$(document).ready(function(){

	if(document.cookie=="")
		document.cookie = JSON.stringify({4:-1, 6:-1, 8:-1, 10:-1})
    	G_NUM_TILES = parseInt($("#num_tiles").html());
	// set num tiles
	$(".num_tiles_selector").click(function(){
		G_NUM_TILES = parseInt($(this).html().split(" ")[1]);
		$("#num_tiles").html(G_NUM_TILES);
	});

	// set game speed
	$("#game_speed_button").click(function(){

		G_GAME_SPEED = ((G_GAME_SPEED+1) % (cMaxGameSpeed+1));
		if (!G_GAME_SPEED) G_GAME_SPEED = 1;
		$("#game_speed").html(G_GAME_SPEED);
	});

	$("#start_game_button").click(start);

	// making dev
	for (var i=0; i<people["Dev"].length; i++){
		node = people["Dev"][i];
		var person = document.createElement("div");
		person.innerHTML = "<b>Developer " + (i+1) + "</b><br>DB: "+node[0]+"<br>.NET: "+node[1]+"<br>Web: "+node[2];
		person.id = "Dev"+i;
		person.setAttribute('class','people dev');
		document.getElementById("toolbox").appendChild(person);
	}
	document.getElementById("toolbox").innerHTML+="<br>";
	// making QE
	for (var i=0; i<people["QE"].length; i++){
		var person = document.createElement("div");
		person.innerHTML = "<b>Quality Engineer " + (i+1) + "</b><br>"+people["QE"][i];
		person.id = "QE"+i;
		person.setAttribute('class','people QE');
		document.getElementById("toolbox").appendChild(person);
	}
	document.getElementById("toolbox").innerHTML+="<br>";
	// making XD
	for (var i=0; i<people["XD"].length; i++){
		var person = document.createElement("div");
		person.innerHTML = "<b>Experience Designer " + (i+1) + "</b><br>"+people["XD"][i];
		person.id = "XD"+i;
		person.setAttribute('class','people XD');
		document.getElementById("toolbox").appendChild(person);
	}
	document.getElementById("toolbox").innerHTML+="<br>";
	// making manager
	for (var i=0; i<people["Manager"]; i++){
		var person = document.createElement("div");
		person.innerHTML = "<b>Manager " + (i+1) + "</b>";
		person.id = "Manager"+i;
		person.setAttribute('class','people manager');
		document.getElementById("toolbox").appendChild(person);
	}
});


// display progress alternates between two states
var _state = true;
function display_progress(){

	for(var id in workers[G_NUM_TILES]){
		task = parseInt(id[id.length-1])-1;

		// blinking effect if work is in progress
		if(_state)
			$("#"+id).css('box-shadow', '2px 2px 19px #e0e0e0');
		else
			$("#"+id).css('box-shadow', '2px 2px 19px red');

		// if manager exists speed up work rate
		if (workers[G_NUM_TILES][id].Manager == undefined)
			manager_boost = 1;
		else
			manager_boost = manager_rate;

		// do working
		for(var type in workers[G_NUM_TILES][id]){
			worker_id = workers[G_NUM_TILES][id][type]
			worker = people[type][worker_id]
			if (type == "Dev"){
				levels[G_NUM_TILES][task][type][0] = Math.max(0, levels[G_NUM_TILES][task][type][0] - manager_boost * dev_base_rate * worker[0]);
				levels[G_NUM_TILES][task][type][1] = Math.max(0, levels[G_NUM_TILES][task][type][1] - manager_boost * dev_base_rate * worker[1]);
				levels[G_NUM_TILES][task][type][2] = Math.max(0, levels[G_NUM_TILES][task][type][2] - manager_boost * dev_base_rate * worker[2]);
			} else if (type != "Manager"){
				levels[G_NUM_TILES][task][type] = Math.max(0, levels[G_NUM_TILES][task][type] - manager_boost * dev_base_rate * worker);
			}
		}
		// refresh ui
    		node = levels[G_NUM_TILES][task];
		var content="";
		if(node.Dev != undefined)
			content+="<div class='dev'>"+node.Dev[0]+"<b>A</b> "+node.Dev[1]+"<b>B</b> "+node.Dev[2]+"<b>C</b><br></div>";
		if(node.QE != undefined)
			content+="<div class='QE'>"+node.QE+"</div>";
		if(node.XD != undefined)
			content+="<div class='XD'>"+node.XD+"</div><br>";

		$("#"+id).html(content);

		// freeing workers
		var isDevExists = false;
		var isQEExists = false;
		var isXDExists = false;
		//TODO update the capability of workers
		for(var type in workers[G_NUM_TILES][id]){
			worker_id = workers[G_NUM_TILES][id][type]
			worker = people[type][worker_id]
			if (type == "Dev"){
				// if all are 0
				if ( !(levels[G_NUM_TILES][task][type][0] || levels[G_NUM_TILES][task][type][1] || levels[G_NUM_TILES][task][type][2]) ){
					delete workers[G_NUM_TILES][id][type];
					$("#"+type+worker_id).fadeIn();
				} else {
					isDevExists = true;
				}

			} else if (type != "Manager"){
				if (!levels[G_NUM_TILES][task][type]){
					delete workers[G_NUM_TILES][id][type];
					$("#"+type+worker_id).fadeIn();
				} else {
					if (type == "QE")
						isQEExists = true;
					else
						isXDExists = true;
				}
			}
		}
		// if all are 0 delete task
		if (!(isDevExists || isQEExists || isXDExists)){
			if(workers[G_NUM_TILES][id].Manager != undefined)
				$("#Manager"+workers[G_NUM_TILES][id].Manager).fadeIn();
			delete workers[G_NUM_TILES][id];
			$("#"+id).css('box-shadow', '2px 2px 19px #e0e0e0');
			// is game over
			var isOver = true;
			for(var i=0; i<levels[G_NUM_TILES].length; i++){
				var node = levels[G_NUM_TILES][i];
				if (JSON.stringify(node.Dev)!=JSON.stringify([0,0,0]) || node.QE != 0 || node.XD != 0)
					isOver = false;
			}
			if(isOver){
				G_GAME_STATE = cGameStopped;
				var high_scores = JSON.parse(document.cookie);
				// set high score
				if(high_scores[G_NUM_TILES]<0 || high_scores[G_NUM_TILES] > TIME){
					high_scores[G_NUM_TILES] = TIME;
					document.cookie = JSON.stringify(high_scores);
				}
			}
		}
		// refresh locks
		var to_lock = [];
		for(var i=0; i<game_connections[G_NUM_TILES].length; i++){
			_parent = game_connections[G_NUM_TILES][i][0];
			_child = game_connections[G_NUM_TILES][i][1];
				if(_parent==2)
				 console.log(workers[G_NUM_TILES]["flowchartWindow"+_parent]);
			var node = levels[G_NUM_TILES][_parent-1];
			// parents are locked or parent is still a worker then lock
			if ((levels[G_NUM_TILES][_parent-1].locked == undefined) || (JSON.stringify(node.Dev)!=JSON.stringify([0,0,0]) || node.QE != 0 || node.XD != 0)){
					to_lock.push(_child);
			}
		}
		for(var i=1; i<=G_NUM_TILES; i++){
			// if a task is currently locked and is not in to_lock then unlock it
			if((levels[G_NUM_TILES][i-1].locked == undefined) && (to_lock.indexOf(i) < 0)){
				levels[G_NUM_TILES][i-1].locked = false;
				var node = levels[G_NUM_TILES][i-1];
				var content="";
				if(node.Dev != undefined)
					content+="<div class='dev'>"+node.Dev[0]+"<b>A</b> "+node.Dev[1]+"<b>B</b> "+node.Dev[2]+"<b>C</b><br></div>";
				if(node.QE != undefined)
					content+="<div class='QE'>"+node.QE+"</div>";
				if(node.XD != undefined)
					content+="<div class='XD'>"+node.XD+"</div><br>";

				$("#flowchartWindow"+i).html(content);
				$("#flowchartWindow"+i).removeClass("locked");
			}
		}

	}
	_state = !_state;

	if(G_GAME_STATE == cGameStarted)
		setTimeout(display_progress, 1000/G_GAME_SPEED);
}
// this simply updates the windows using the array levels
function create_tiles(){
    // add nodes
    for(var i=0; i<G_NUM_TILES; i++){
	_window = document.createElement("div");
	_window.id = "flowchartWindow"+(i+1);
	_window.setAttribute("class", "window");

    	node = levels[G_NUM_TILES][i];
	// see if level is locked
	if(node.locked == false){
		var content="";
		if(node.Dev != undefined)
			content+="<div class='dev'>"+node.Dev[0]+"<b>A</b> "+node.Dev[1]+"<b>B</b> "+node.Dev[2]+"<b>C</b><br></div>";
		if(node.QE != undefined)
			content+="<div class='QE'>"+node.QE+"</div>";
		if(node.XD != undefined)
			content+="<div class='XD'>"+node.XD+"</div><br>";
		_window.innerHTML = content;
	}
	else{
		_window.setAttribute("class", "window locked");
		_window.innerHTML = "<b>LOCKED</b>";
	}
	document.getElementById("flow").appendChild(_window);
    }
}
function timer(){
	TIME+=1;
	time = "";
	sec = TIME%60;
	if(sec<10) sec = "0"+sec;
	min = Math.floor(TIME/60)%60
	if(min<10) min = "0"+min;
	hrs = Math.floor(TIME/3600)
	if(hrs<10) hrs = "0"+hrs;
	time = hrs+":"+min+":"+sec
	$("#timer").html(time);	
	if(G_GAME_STATE == cGameStarted)
		setTimeout(timer,1000/G_GAME_SPEED);
	
}
function start() {
    // create tiles
    create_tiles();

    // show high score
    var score = JSON.parse(document.cookie)[G_NUM_TILES];
    if (score>0){
    	var time = "";
    	sec = score%60;
    	if(sec<10) sec = "0"+sec;
    	min = Math.floor(score/60)%60
    	if(min<10) min = "0"+min;
    	hrs = Math.floor(score/3600)
    	if(hrs<10) hrs = "0"+hrs;
    	time = hrs+":"+min+":"+sec
    	$("#high_score").html(time);
    }

    // make all the people in the toolbox draggable
    $(".people").draggable({revert: true});
    $(".window").droppable({
    	drop: function(e,ui){
	//TODO check if the task is locked
		id = ui.draggable[0].id;
		index = parseInt(id[id.length-1]);
		type = id.substr(0,id.length-1);
		if(workers[G_NUM_TILES][this.id] == undefined){
			workers[G_NUM_TILES][this.id] = {};
			workers[G_NUM_TILES][this.id][type] = index;
			$("#"+id).fadeOut();
		} else {
			if(workers[G_NUM_TILES][this.id][type] == undefined){
				workers[G_NUM_TILES][this.id][type] = index;
				$("#"+id).fadeOut();
			}
		}
	},
	accept: ".people"
    });

    var instance = jsPlumb.getInstance({
        // default drag options
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: [
            [ "Arrow", { location: 1 } ],
        ],
        Container: "flow"
    });

    var basicType = {
        connector: "StateMachine",
        paintStyle: { strokeStyle: "red", lineWidth: 4 },
        hoverPaintStyle: { strokeStyle: "blue" },
        overlays: [
            "Arrow"
        ]
    };
    instance.registerConnectionType("basic", basicType);

    // this is the paint style for the connecting lines..
    var connectorPaintStyle = {
            lineWidth: 4,
            strokeStyle: "#61B7CF",
            joinstyle: "round",
            outlineColor: "white",
            outlineWidth: 2
        },
    // .. and this is the hover style.
        connectorHoverStyle = {
            lineWidth: 4,
            strokeStyle: "#216477",
            outlineWidth: 2,
            outlineColor: "white"
        },
        endpointHoverStyle = {
            fillStyle: "#216477",
            strokeStyle: "#216477"
        },
    // the definition of source endpoints (the small blue ones)
        sourceEndpoint = {
            endpoint: "Dot",
            paintStyle: {
                strokeStyle: "#7AB02C",
                fillStyle: "transparent",
                radius: 7,
                lineWidth: 3
            },
            isSource: true,
            connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [
                [ "Label", {
                    location: [0.5, 1.5],
                    label: "Drag",
                    cssClass: "endpointSourceLabel"
                } ]
            ]
        },
    // the definition of target endpoints (will appear when the user drags a connection)
        targetEndpoint = {
            endpoint: "Dot",
            paintStyle: { fillStyle: "#7AB02C", radius: 11 },
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            dropOptions: { hoverClass: "hover", activeClass: "active" },
            isTarget: true,
            overlays: [
                [ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel" } ]
            ]
        },
        init = function (connection) {
            connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
        };

    var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
        for (var i = 0; i < sourceAnchors.length; i++) {
            var sourceUUID = toId + sourceAnchors[i];
            instance.addEndpoint("flowchart" + toId, sourceEndpoint, { anchor: sourceAnchors[i], uuid: sourceUUID });
        }
        for (var j = 0; j < targetAnchors.length; j++) {
            var targetUUID = toId + targetAnchors[j];
            instance.addEndpoint("flowchart" + toId, targetEndpoint, { anchor: targetAnchors[j], uuid: targetUUID });
        }
    };

    // set window positions
    for (var i=1; i<=G_NUM_TILES; i++){
    	node = window_positions[G_NUM_TILES][i-1];
	$("#flowchartWindow"+i).css('left', node[0]+"%");
	$("#flowchartWindow"+i).css('top', node[1]+"%");
    }
    // suspend drawing and initialise.
    instance.batch(function () {

	for(var i=0; i< game_connections[G_NUM_TILES].length; i++){
		node = game_connections[G_NUM_TILES][i];
        	_addEndpoints("Window"+node[0], [node[2]], []);
        	_addEndpoints("Window"+node[1], [], [node[3]]);
	}

        // listen for new connections; initialise them the same way we initialise the connections at startup.
        instance.bind("connection", function (connInfo, originalEvent) {
            init(connInfo.connection);
        });

        //jsPlumb.draggable(document.querySelectorAll(".window"), { grid: [20, 20] });

        // connect the tiles
	for(var i=0; i< game_connections[G_NUM_TILES].length; i++){
		node = game_connections[G_NUM_TILES][i];
        	instance.connect({uuids: ["Window"+node[0]+node[2], "Window"+node[1]+node[3]], editable: false});
	}

        //
        // listen for clicks on connections, and offer to delete connections on click.
        //
        instance.bind("click", function (conn, originalEvent) {
           // if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
             //   instance.detach(conn);
            conn.toggleType("basic");
        });

        instance.bind("connectionDrag", function (connection) {
            console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
        });

        instance.bind("connectionDragStop", function (connection) {
            console.log("connection " + connection.id + " was dragged");
        });

        instance.bind("connectionMoved", function (params) {
            console.log("connection " + params.connection.id + " was moved");
        });
    });

    jsPlumb.fire("nick fury loaded", instance);

    // set flag of game state
    G_GAME_STATE = cGameStarted;
    display_progress();
    timer();
}
