//touch interaction var
var m= {x:0, y:0};
var mi= {x:0, y:0};

var initialize = true;
var grow;
var g;
var offset = 0;
var speed = -0.5;
var ydiff=0;
var outVal=0;

var note =50;

var synthsOn=false;

var backcolor;
var frontcolor;



function setup() {
  colorMode(HSB,100,100,100);
  createCanvas(windowWidth, windowHeight);
  grow = windowHeight;
  background(0);
  initSynth();


  backcolor = color(50,100,70); //to hue 90
  frontcolor = color(90,100,100); //to hue 13




  //disable default touch events for mobile
  var el = document.getElementsByTagName("canvas")[0];
  el.addEventListener("touchstart", pdefault, false);
  el.addEventListener("touchend", pdefault, false);
  el.addEventListener("touchcancel", pdefault, false);
  el.addEventListener("touchleave", pdefault, false);
  el.addEventListener("touchmove", pdefault, false);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function pdefault(e){
  e.preventDefault()
}

function draw() {
  update();
  render();
}

function update(){
  //normalize interaction
  m.x = max(touchX, mouseX);
  m.y = max(touchY, mouseY);
  m.pressed = mouseIsPressed || touchIsDown;

  if(synthsOn){

    //drones higher w pull
    fsynth.lfo.frequency.value=(map(outVal,1,0,note*10.7,note*10.4));
    fsynth.setVolume(map(outVal,1,0,0.2,0));

    dsynth.setPitch(map(outVal,1,0,note*4*2,note*4*2.1));
    dsynth.lfo.frequency.value=(map(outVal,1,0,note*4.01,note*4.05));
    dsynth.setVolume(map(outVal,1,0,0.2,0));



    //back drones
    gsynth.setVolume(map(outVal,1,0,0.1,0.50));
    hsynth.setVolume(map(outVal,1,0,0.1,0.50));

    esynth.setPitch(map(outVal,1,0,note*4.1,note*4));
    esynth.setVolume(map(outVal,1,0,0.1,0.85));
  }


  var bcol = (50+50*outVal)%100;
  var bsat = 70;
  if(outVal>0.85){bsat+=(map(outVal,.85,1,0,25))}
  backcolor = color(bcol,100,bsat); //to hue 90
  var fcol = (90 -77*outVal)%100;
  var fsat = map(outVal, 0,1,100,40);
  frontcolor = color(fcol,fsat,100); //to hue 13



}


function render(){
  var ratio_angle = windowWidth/3.8;
  var maxGrow = windowHeight + ratio_angle;
  var minGrow = windowHeight - ratio_angle;

  outVal = (grow-minGrow)/(maxGrow-minGrow);

  //if(frameCount%10==0){console.log(outVal);}

  if(!m.pressed){
    if(initialize==false){
      console.log('test');
      ydiff=0;
    }
    grow-=1;
    initialize=true;


  }

  if(m.pressed){
    if(initialize){
      mi.y = m.y;
      initialize=false;
    }
    ydiff = (mi.y-m.y);

    if(speed<10){
      if(grow<maxGrow && grow>minGrow){
        if (ydiff < ratio_angle*2){
          grow= grow - ydiff;
          mi.y = m.y;
        }
      }else{
        if(grow>=maxGrow){
          if(ydiff<=0){
            offset=-1*ydiff;
          }else{
            grow= grow - ydiff;
            mi.y = m.y;
          }
        }
        if(grow<=minGrow){
          if(ydiff>=0){
            offset=-ydiff;
          }else{
            grow= grow - ydiff;
            mi.y = m.y;
          }

        }
      }

    }

    /*
       if(grow<=minGrow){
       speed--;
       }
       if(grow>=maxGrow){
       speed++;
       }
       */



  }

  background(backcolor);
  stroke(255);
  strokeWeight(10);


  for(var i=-40; i<windowHeight/20+30; i+=1){
    // line(i, 0, i, windowHeight);
    strokeWeight(Math.pow((i+40+(ydiff/20))/20,2));
    stroke(frontcolor);
    line(0, windowHeight- 20*i + offset, windowWidth/2,grow-20*i + offset);
    strokeWeight(Math.pow((i+40+(ydiff/20))/20,2));
    stroke(frontcolor);
    line(windowWidth, windowHeight- 20*i+offset, windowWidth/2,grow-20*i+offset);
  }


  if(grow>maxGrow){grow=maxGrow;}
  if(grow<minGrow){grow=minGrow;}

  if(grow==maxGrow){
  }

  if(grow> minGrow){
  }

  offset+=speed;
  offset%=20;
}



function Drone(f, vol, lfo_rate, lfo_pitch_freq){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = vol;
  this.pitch = f;
  this.lfo_rate = lfo_rate;
  this.lfo_pitch_freq = lfo_pitch_freq;
  this.buildSynth();
  this.play();
}


Drone.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = "sawtooth";
  this.osc.frequency.value = this.pitch;


  //lfo to osc
  this.lfo = context.createOscillator(); // Create sound source
  this.lfo.type = "sine";
  this.lfo.frequency.value = this.lfo_pitch_freq;
  this.lfoGain = context.createGain(); // Create sound source
  this.lfoGain.gain.value = 200;
  this.lfo.connect(this.lfoGain);
  this.lfoGain.connect(this.osc.frequency);
  this.lfo.start(0);

  this.filter = context.createBiquadFilter();
  this.filter.type = "lowpass";
  this.filter.frequency.value = 500;

  //lfo to filter
  this.filtlfo = context.createOscillator();
  this.filtlfo.type ="sine";
  this.filtlfo.frequency.value = this.lfo_rate;
  this.filtlfoGain = context.createGain();
  this.filtlfoGain.gain.value = 50;
  this.filtlfo.connect(this.filtlfoGain);
  this.filtlfoGain.connect(this.filter.frequency);
  this.filtlfo.start(0);




  this.gain = context.createGain();
  this.gain.gain.value = this.volume;



  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Drone.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Drone.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Drone.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Drone.prototype.play = function(){
  this.osc.start(0); // Play instantly
}

Drone.prototype.stop = function(){
  this.setVolume(0);
  this.osc.disconnect();
  return false;
}


function initSynth(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();

    var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
    if (iOS) {
      window.addEventListener('touchend', function() {
        var buffer = context.createBuffer(1, 1, 22050);
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
      }, false);
    }
  }
  catch (err){
    alert('web audio not supported');
  }

  if(typeof(context)!="undefined"){

     document.getElementById('play').addEventListener('touchend', playAudio);
     document.getElementById('play').addEventListener('mouseup', playAudio);


  }
}

function playAudio(){
    gsynth = new Drone(note, 0.8, 0.1, note*2.008);
    gsynth.setFilter(150); //200
    gsynth.setVolume(0);

    esynth = new Drone(note*4, 0.7, 0.2, note*2.001);
    esynth.setFilter(120); //120
    esynth.setVolume(0);

    hsynth = new Drone(note*5*4/3, 0.7, 0.22, note*5.001);
    hsynth.setFilter(110); //120
    hsynth.setVolume(0);


    asynth = new Drone(note*8*3/2, 0.15, 0.08, note*4.001);
    asynth.setFilter(200); //120

    bsynth = new Drone(note*9*4/3, 0.2, 0.11, note*5*4/3);
    bsynth.setFilter(200); //120


    dsynth = new Drone(note*4*2, 0.2, 0, note*4.001);
    dsynth.lfoGain.gain.value = 1000;
    dsynth.setFilter(500);
    dsynth.setVolume(0);

    fsynth = new Drone(note*4*1/3, 0.2, 200, note*4.601);
    fsynth.lfoGain.gain.value = 500;
    fsynth.setFilter(500);
    fsynth.setVolume(0);
    var elem = document.getElementById("play");
    elem.parentNode.removeChild(elem);
    synthsOn=true;
}

