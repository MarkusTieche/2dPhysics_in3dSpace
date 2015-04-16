function init()
{
    var scene = new THREE.Scene();//Create a new threeJS scene
    
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var renderer = new THREE.WebGLRenderer({antialias:true});//init the render which creates a new canvas element
        renderer.setClearColor(new THREE.Color('lightgrey'), 1)
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        document.body.appendChild( renderer.domElement );
        renderer.domElement.id = "canvas_threeJS";//Add an id to the canvas for later access
    
    //Add a camera to the scene
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR =1000;
    var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(-4,6,8);
        scene.add(camera);
    
    // handle window resize
	window.addEventListener('resize', function(){
		renderer.setSize( window.innerWidth, window.innerHeight )
		camera.aspect	= window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix();
	}, false);

    
    //Add the ambient light
    var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight)
    
    // CONTROLS
    var controls = new THREE.OrbitControls(camera);
        controls.maxDistance = 14;
        controls.noPan = true;
        controls.maxPolarAngle = 1.4;
    
    //ADD POINT LIGHT
    var light = new THREE.PointLight(0xffffff,.7);
        light.position.set(0,7,3);
        scene.add(light);
    
    //INIT PHYSICS
    var world = new p2.World();
        world.sleepMode = p2.World.BODY_SLEEPING;
    
    //INIT DEBUG VIEW
    var physicsDebug = new debug(world);
    
    //ADD EVENT LISTENER FOR BUTTON
    document.getElementById("btn_add").onclick = addBox;
    
    addBackground();
    
    //START RENDER
    update();
    
    
    function addBackground()
    {
        var skyBoxTexture = new THREE.ImageUtils.loadTexture( 'assets/grid.png' );
            skyBoxTexture.wrapS = skyBoxTexture.wrapT = THREE.RepeatWrapping; 
            skyBoxTexture.repeat.set( 4, 4 );

        var floorMat =  new THREE.MeshPhongMaterial( { map: skyBoxTexture, side: THREE.BackSide,shininess: 1} );

        var skyBox = new THREE.Mesh(new THREE.BoxGeometry(20,20,20), floorMat);
            skyBox.position.y += 10;
            scene.add(skyBox);
        
        var planeShape = new p2.Plane();
        var planeBody = new p2.Body({position:[0,0]});
            planeBody.name = "ground";
            planeBody.data = skyBox;
            planeBody.addShape(planeShape);
            world.addBody(planeBody);
    }
    
    function addBox()
    {
        var w = 0.1+Math.random();
        var h = 0.1+Math.random();
        
        var x = (Math.random()*10)-5;
        var y = 3;
        
        var material = new THREE.MeshPhongMaterial( { color: getRandomColor() } );
        
        var cube = new THREE.Mesh(new THREE.BoxGeometry(w, h, .5), material);
            cube.position.set(x,y,0)
            scene.add(cube);
        
        var boxShape = new p2.Rectangle(w,h);
        var boxBody = new p2.Body({ mass:1, position:[x,y],angularVelocity:1 });
            boxBody.allowSleep = true;
            boxBody.sleepSpeedLimit = 1; // Body will feel sleepy if speed<1 (speed is the norm of velocity)
            boxBody.sleepTimeLimit =  1; // Body falls asleep after 1s of sleepiness
            boxBody.data = cube;
            boxBody.name="box";
            boxBody.addShape(boxShape);
            world.addBody(boxBody);
    }
    
    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
     }
    
    function update()
    {
        // keep rendering
        requestAnimationFrame( update );
    
        
        
        //UPDATE PHYSICS
        world.step(1/60);
        
        //DRAW DEBUG
        physicsDebug.update()
        
        //UPDATE 3D Objects
        for (var i = 0; i < world.bodies.length; i++) 
        { 
            if(world.bodies[i].name == "box")
            {
                world.bodies[i].data.position.set(world.bodies[i].position[0],world.bodies[i].position[1],0);
                world.bodies[i].data.rotation.z = world.bodies[i].angle; 
            }
        };  
        
        //UPDATE 3D SCENE
        renderer.render( scene, camera );		
    };
};

var debug = function(world)
{
    //CREATE AND DEFINE DEBUG CANVAS
    var canvas = document.createElement("canvas");        // Create a <canvas> element
        document.body.appendChild(canvas);
        canvas.style.position = "absolute";
        canvas.style.backgroundColor = "rgba(100,100,100,0.5)";
        canvas.style.zIndex = "100";
        canvas.style.left = "0px";
        canvas.width =window.innerWidth/6;
        canvas.height = window.innerHeight/6;
    
    this.w = canvas.width;
    this.h = canvas.height;
    
    this.world = world;
    
    this.ctx = canvas.getContext("2d");
    this.ctx.lineWidth = 0.05;
    this.ctx.strokeStyle = '#b22020';
    
}

debug.prototype.drawPlane = function() 
{
    var y = 0;
    this.ctx.moveTo(-this.w, y);
    this.ctx.lineTo( this.w, y);
    this.ctx.stroke();
}

debug.prototype.drawBox = function(body) 
{
        this.ctx.beginPath();
        var x = body.position[0],
            y = body.position[1];
        this.ctx.save();
        this.ctx.translate(x, y);        // Translate to the center of the box
        this.ctx.rotate(body.angle);  // Rotate to the box body frame
        this.ctx.rect(-body.shapes[0].width/2, -body.shapes[0].height/2, body.shapes[0].width, body.shapes[0].height);
        this.ctx.stroke();
        this.ctx.restore();
}

debug.prototype.update = function() 
{
    this.ctx.clearRect(0,0,this.w,this.h);

    this.ctx.save();
    this.ctx.translate(this.w/2, this.h-10);  // Translate to the center
    this.ctx.scale(15, -15);       // Zoom i
    
    // Draw all bodies
    for (var i = 0; i < this.world.bodies.length; i++) 
    { 
        if(this.world.bodies[i].name == "box")
        {
            this.drawBox(this.world.bodies[i]);
        }
    };  
    
    this.drawPlane();
    
    this.ctx.restore();
}



