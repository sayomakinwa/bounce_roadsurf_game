var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var sun;
var ground;
var orbitControl;
var roadObject;
var ballObject;
var ballRollSpeed;
var stats;
var pointsText;
var points;
var hasTouched;
var gameID;
var sphericalHelp;
var pathAngles;
var presentTrack;
var clock;
var jump;
var treesAlongPath;
var treesSet;

var roadRad = 26;
var ballRad = 0.22;
var ballBaseY = 2;
var bounceRate = 0.1;
var gravityVal = 0.005;
var leftTrack = -1.0;
var rightTrack = 1.0;
var middleTrack = 0;
var treesIntervals = 0.5;
var lastTreeReleaseTime = 0;
var gameOver = false;
var enableHemiLight = false;
var gameDifficulty = 0;
var rollSpeed = 0.002;
var pointsMultiplier = 4;



function startGame() {
	if (document.querySelector('input[name="gameTheme"]:checked').value == "1") {
		enableHemiLight = true;
	}

	if (document.querySelector('input[name="difficulty"]:checked').value == "1") {
		rollSpeed = 0.006;
		pointsMultiplier = 6;
	}
	else if (document.querySelector('input[name="difficulty"]:checked').value == "2") {
		rollSpeed = 0.010;
		pointsMultiplier = 8;
	}
	else if (document.querySelector('input[name="difficulty"]:checked').value == "3") {
		rollSpeed = 0.014;
		pointsMultiplier = 10;
	}

    document.getElementById("landingPage").outerHTML = "";

	buildGameScene();
	gameLoop();
	return false;
}

function buildGameScene(){
	hasTouched = false;
	points = 0;

	treesAlongPath = [];
	treesSet = [];

	clock = new THREE.Clock();
	clock.start();

	sphericalHelp = new THREE.Spherical();
	ballRollSpeed = ((rollSpeed/ballRad) * roadRad)/5;
	
    sceneWidth = window.innerWidth;
    sceneHeight = window.innerHeight;
    pathAngles = [1.5125, 1.5655, 1.6125];

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xf1ffe1, 0.15);

    camera = new THREE.PerspectiveCamera( 65, sceneWidth / sceneHeight, 0.50, 20000 );
    camera.position.z = 7;
	camera.position.y = 4;

    renderer = new THREE.WebGLRenderer({alpha:false});
	renderer.setClearColor(0xfefbfb, 1);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );

    stats = new Stats();
    dom = document.getElementById("game");
	dom.appendChild(renderer.domElement);
	dom.appendChild(stats.dom);

	createGameLight();
	createRoad();
	createTreesSet(10);
	createGameBall();
	
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );//OrbitControl helps to rotate camera
	orbitControl.addEventListener( "change", render );

	orbitControl.enableZoom = false;
	orbitControl.noKeys = true;
	orbitControl.noPan = true;
	orbitControl.enableDamping = true;
	orbitControl.dampingFactor = 0.75;
	orbitControl.minAzimuthAngle = -0.25;
	orbitControl.maxAzimuthAngle = 0.1;
	orbitControl.minPolarAngle = 1.2;
	orbitControl.maxPolarAngle = 1.2;
	
	window.addEventListener("resize", windowResizeCallback, false);
	document.onkeydown = keyPressFunction;
	
	pointsText = document.createElement("div");
	pointsText.style.position = "absolute";
	
	pointsText.innerHTML = userFriendlyPoints(points);
	pointsText.id = "pointsDiv"
	pointsText.style.top = "10px";
	pointsText.style.left = "100px";
	pointsText.style.width = 90;
	pointsText.style.height = 90;
	document.body.appendChild(pointsText);
}

function createTreesSet(maxTreesInSet){
	var newTree;
	for(var i=0; i<maxTreesInSet; i++){
		if (Math.random() > 0.5) {
			newTree = createTreeObstacle(false);
		}
		else {
			newTree = createHalfTreeObstacle();
		}
		
		treesSet.push(newTree);
	}
}

function keyPressFunction(keyEvent){
	if (jump) return;

	var moveIsValid = true;

	if (keyEvent.keyCode === 37) { //left arrow key
		
		if (presentTrack == middleTrack) presentTrack = leftTrack;
		else if (presentTrack == rightTrack) presentTrack = middleTrack;
		else moveIsValid = false;

	}
	else if (keyEvent.keyCode === 39) {//right arrow key

		if (presentTrack == middleTrack) presentTrack = rightTrack;
		else if(presentTrack == leftTrack) presentTrack = middleTrack;
		else moveIsValid = false;

	}
	else {
		if (keyEvent.keyCode === 38 || keyEvent.keyCode === 32){//up or spacebar to jump
			bounceRate = 0.1;
			jump = true;
		}
		moveIsValid = false;
	}


	if (moveIsValid) {
		jump = true;
		bounceRate = 0.06;
	}
}

function createGameBall(){
	var sphereGeometry = new THREE.DodecahedronGeometry(ballRad, 3);
	var sphereMaterial = new THREE.MeshStandardMaterial( {color: 0xCCCC00, shading:THREE.FlatShading} );
	ballObject = new THREE.Mesh(sphereGeometry, sphereMaterial);

	ballObject.receiveShadow = true;
	ballObject.castShadow = true;
	
	presentTrack = middleTrack;
	ballObject.position.x = presentTrack;
	ballObject.position.y = ballBaseY;
	ballObject.position.z = 4.795;

	scene.add( ballObject );

	jump = false;
}

function createRoad(){
	var horiSegments = 500;
	var verSegments = 30;

	var sphereGeometry = new THREE.SphereGeometry( roadRad, horiSegments, verSegments);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xeffbeb, shading:THREE.FlatShading} )
	
	roadObject = new THREE.Mesh( sphereGeometry, sphereMaterial );

	roadObject.receiveShadow = true;
	roadObject.castShadow = false;

	roadObject.position.y = -23.9995;
	roadObject.position.z = 1.9995;
	roadObject.rotation.z = - Math.PI/2;

	scene.add( roadObject );
	createRoadsideTrees();
}

function createGameLight(){	
	sun = new THREE.DirectionalLight( 0xEDE792, 0.85);
	sun.position.set(11, 5, -6);
	sun.castShadow = true;
	scene.add(sun);

	//sunlight shadow values
	sun.shadow.camera.near = 0.55;
	sun.shadow.camera.far = 60;
	sun.shadow.mapSize.width = 255;
	sun.shadow.mapSize.height = 255;

	if (enableHemiLight) {
		var hemiLight = new THREE.HemisphereLight(0xefebeb, 0x010101, .85)
		scene.add(hemiLight);
	}
}

function addInRoadTree() {
	var options = [0, 1, 2];
	var roadPath = Math.floor(Math.random()*3);
	addTreeToRoad(roadPath, true);
	options.splice(roadPath, 1);

	if(Math.random() > 0.5){
		roadPath = Math.floor(Math.random() * 2);
		addTreeToRoad(options[roadPath], true);
	}
}

function createRoadsideTrees(){
	var treesNum = 38;
	var space = 6.25/38;
	for (var i=0; i<treesNum; i++){
		addTreeToRoad(i*space, false, true);
		addTreeToRoad(i*space, false, false);
	}
}

function addTreeToRoad(row, alongPath, isRight){
	var newTree;
	if (!alongPath) {
		newTree = createTreeObstacle(true);
		var sidewaysAreaAngle = 0;

		if(isRight) {
			sidewaysAreaAngle = 1.44 - (Math.random() * 0.1);
		}
		else {
			sidewaysAreaAngle = 1.7 + (Math.random() * 0.1);
		}

		sphericalHelp.set( roadRad - 0.3, sidewaysAreaAngle, row );
	}
	else {
		if (treesSet.length == 0) return;

		newTree = treesSet.pop();
		newTree.visible = true;
		treesAlongPath.push(newTree);
		sphericalHelp.set( roadRad - 0.3, pathAngles[row], -roadObject.rotation.x+4 );
		
	}

	newTree.position.setFromSpherical( sphericalHelp );
	var rollGroundVec = roadObject.position.clone().normalize();
	var treeVec = newTree.position.clone().normalize();
	newTree.quaternion.setFromUnitVectors(treeVec, rollGroundVec);
	newTree.rotation.x += (Math.random()*(2*Math.PI/10)) + (-Math.PI/10);
	
	roadObject.add(newTree);
}

function createTreeObstacle(sideway){
	var sides = 9;
	var multiplier = (Math.random() * (0.25 - 0.1)) + 0.05;

	
	if (sideway)
		var treeLeavesGeometry = new THREE.ConeGeometry( 0.6, 3.1, sides, 6);
	else
		var treeLeavesGeometry = new THREE.ConeGeometry( 0.6, 1.0, sides, 6);

	var treeLeavesMaterial = new THREE.MeshStandardMaterial( { color: 0x34fe33, shading:THREE.FlatShading } );

	blowUpTreeLeaves(treeLeavesGeometry.vertices, sides, 0, multiplier);
	tightenTreeLeaves(treeLeavesGeometry.vertices, sides, 1);
	blowUpTreeLeaves(treeLeavesGeometry.vertices, sides, 2, multiplier*1.11, true);
	tightenTreeLeaves(treeLeavesGeometry.vertices, sides, 3);
	blowUpTreeLeaves(treeLeavesGeometry.vertices, sides, 4, multiplier*1.21);
	tightenTreeLeaves(treeLeavesGeometry.vertices, sides, 5);

	var treeLeaves = new THREE.Mesh( treeLeavesGeometry, treeLeavesMaterial );
	treeLeaves.castShadow = true;
	treeLeaves.receiveShadow = false;
	treeLeaves.position.y = 1.1;
	treeLeaves.rotation.y = (Math.random()*(Math.PI));

	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.125, 1.1);
	var treeTrunkMaterial = new THREE.MeshStandardMaterial( { color: 0x876732, shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, treeTrunkMaterial );
	treeTrunk.position.y = 0.249;

	var tree = new THREE.Object3D();
	tree.add(treeTrunk);
	tree.add(treeLeaves);

	return tree;
}


function createHalfTreeObstacle(){
	var multiplier = (Math.random() * (0.25 - 0.1)) + 0.05;

	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.08, 0.125, 1.1);
	var treeTrunkMaterial = new THREE.MeshStandardMaterial( { color: 0x876732, shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, treeTrunkMaterial );
	treeTrunk.position.y = 0.3;

	treeTrunk.rotation.z = Math.PI/2;

	var tree =new THREE.Object3D();
	tree.add(treeTrunk);

	return tree;
}


function blowUpTreeLeaves(leavesVertices, leavesSides, currentTier, multiplier, odd){
	var vertIndex;
	var vertVec = new THREE.Vector3();
	var midPointVec = leavesVertices[0].clone();
	var offset;

	for(var i=0; i<leavesSides; i++){
		vertIndex = (currentTier*leavesSides) + 1;
		vertVec = leavesVertices[i+vertIndex].clone();
		midPointVec.y = vertVec.y;
		offset = vertVec.sub(midPointVec);

		if(odd){

			if(i%2 === 0){
				offset.normalize().multiplyScalar(multiplier/6);
				leavesVertices[i+vertIndex].add(offset);
			}
			else{
				offset.normalize().multiplyScalar(multiplier);
				leavesVertices[i+vertIndex].add(offset);
				leavesVertices[i+vertIndex].y = leavesVertices[i+vertIndex+leavesSides].y + 0.05;
			}
		}
		else{
			if(i%2 !== 0){
				offset.normalize().multiplyScalar(multiplier/6);
				leavesVertices[i+vertIndex].add(offset);
			}
			else{
				offset.normalize().multiplyScalar(multiplier);
				leavesVertices[i+vertIndex].add(offset);
				leavesVertices[i+vertIndex].y = leavesVertices[i+vertIndex+leavesSides].y+0.05;
			}
		}
	}
}

function tightenTreeLeaves(leavesVertices, leavesSides, currentTier){
	var vertIndex;
	var offset;

	var vertVec = new THREE.Vector3();
	var midPointVect = leavesVertices[0].clone();
	
	for(var i=0;i<leavesSides;i++){
		vertIndex = (currentTier*leavesSides) + 1;
		vertVec = leavesVertices[i+vertIndex].clone();
		midPointVect.y = vertVec.y;
		offset = vertVec.sub(midPointVect);
		offset.normalize().multiplyScalar(0.06);
		leavesVertices[i+vertIndex].sub(offset);
	}
}

function gameLoop(){
	if (gameOver) return;

	stats.update();
    
    //animation
    ballObject.rotation.x -= ballRollSpeed;
    roadObject.rotation.x += rollSpeed;

    if (ballObject.position.y <= ballBaseY){
    	jump = false;
    	bounceRate = (Math.random()*0.04) + 0.005;
    }

    ballObject.position.y += bounceRate;
    ballObject.position.x = THREE.Math.lerp(ballObject.position.x, presentTrack, 2*clock.getDelta());
    bounceRate -= gravityVal;
    
    if (clock.getElapsedTime() > treesIntervals) {
    	clock.start();
    	addInRoadTree();

    	points += pointsMultiplier * treesIntervals;
    	pointsText.innerHTML = userFriendlyPoints(points);

    }
    doTreePassing();
    render();
	gameID = requestAnimationFrame(gameLoop);//request next update
}

function doTreePassing() {
	var singleTree;
	var treePosition = new THREE.Vector3();
	var treesOutOfScene = [];

	treesAlongPath.forEach( function (element, index) {
		singleTree = treesAlongPath[index];
		treePosition.setFromMatrixPosition(singleTree.matrixWorld);
		if(treePosition.z > 6 && singleTree.visible){//tree no longer visible
			treesOutOfScene.push(singleTree);
		}
		else{//check to see if ball callided with tree
			if (treePosition.distanceTo(ballObject.position) <= 0.7){
				hasTouched = true;
				gameIsOver();

			}
		}
	});

	var from;
	treesOutOfScene.forEach( function ( element, index ) {
		singleTree = treesOutOfScene[ index ];
		from = treesAlongPath.indexOf(singleTree);
		treesAlongPath.splice(from, 1);
		treesSet.push(singleTree);
		singleTree.visible = false;
	});
}

function render(){
    renderer.render(scene, camera);
}

function gameIsOver(){
	gameOver = true;
	cancelAnimationFrame(gameID);
	clock.stop();

	document.getElementById("game").outerHTML = "";
	document.getElementById("pointsDiv").outerHTML = "";
	document.getElementById("gameOverPoints").innerHTML = points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	document.getElementById("gameOverDiv").setAttribute("style", " text-align: center; margin: 50px 10px;")

}

function windowResizeCallback() {
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}

function userFriendlyPoints(number) {
	return '<span style="font-size: 18px;"> <span style="color:red; font-weight: bold;">Points</span>: ' + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</span>';
}