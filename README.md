# 🎨 Node.js + Express + p5.js Canvas App

This project utilizes **Node.js**, **Express**, and **p5.js** to create interactive graphics in the browser. It supports full **mouse and keyboard input**, as well as dynamic canvas drawing.

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
Run the server:

bash
Copy
Edit
node server.js
Open the app:

In GitHub Codespaces, click the Ports tab

Open port 3000 in a browser

🖱️ Input Functions (p5.js)
🖱️ Mouse Input

Function	Description
mouseX	Current X position of the mouse
mouseY	Current Y position of the mouse
pmouseX	Previous X position of the mouse
pmouseY	Previous Y position of the mouse
mouseIsPressed	true if mouse is pressed
mouseButton	Which button: LEFT, RIGHT, CENTER
mousePressed()	Called once when mouse is pressed
mouseReleased()	Called once when mouse is released
mouseClicked()	Called once after mouse press & release
mouseMoved()	Called whenever mouse is moved
mouseDragged()	Called when mouse moves with button pressed
mouseWheel(event)	Called when mouse wheel is scrolled
🎹 Keyboard Input

Function	Description
key	The last key pressed
keyCode	ASCII or special key code
keyIsPressed	true if any key is held down
keyPressed()	Called when any key is pressed
keyReleased()	Called when any key is released
keyTyped()	Called when a key is typed (character only)
🖥️ Window & Touch Input

Function	Description
windowResized()	Called when the window is resized
touchStarted()	Called when a touch starts
touchMoved()	Called when a touch moves
touchEnded()	Called when a touch ends
deviceMoved()	Called when the device is moved
deviceTurned()	Called when the device is turned
deviceShaken()	Called when the device is shaken
🖼️ Display & Canvas Functions
📏 Canvas Setup

Function	Description
createCanvas(w, h)	Creates the drawing canvas
resizeCanvas(w, h)	Changes canvas size
noCanvas()	Removes the canvas
pixelDensity()	Controls high-DPI rendering
background(r, g, b)	Sets background color
clear()	Clears the canvas
🎨 Drawing Primitives

Function	Description
point(x, y)	Draws a single point
line(x1, y1, x2, y2)	Draws a line
rect(x, y, w, h)	Draws a rectangle
ellipse(x, y, w, h)	Draws a circle/oval
triangle(x1, y1, x2, y2, x3, y3)	Draws a triangle
quad(x1, y1, x2, y2, x3, y3, x4, y4)	Draws a quadrilateral
arc(x, y, w, h, start, stop)	Draws an arc
bezier(x1, y1, x2, y2, x3, y3, x4, y4)	Draws a Bézier curve
curve(x1, y1, x2, y2, x3, y3, x4, y4)	Draws a curve
🖌️ Color & Style

Function	Description
fill(r, g, b, [a])	Sets fill color for shapes
noFill()	Disables fill
stroke(r, g, b, [a])	Sets outline color
noStroke()	Disables outline
strokeWeight(w)	Sets stroke thickness
strokeCap()	Sets the style for the endpoints of lines
strokeJoin()	Sets the style for the joins of lines
📝 Text

Function	Description
text(str, x, y)	Draws text on canvas
textSize(s)	Sets text size
textAlign(horiz, vert)	Sets text alignment
textFont(font)	Sets the current font
textLeading(leading)	Sets the spacing between lines of text
🖼️ Images

Function	Description
loadImage(path, [callback])	Loads an image from a file
image(img, x, y, [w], [h])	Draws an image to the canvas
imageMode(mode)	Sets the mode for drawing images
get(x, y, [w], [h])	Reads the color of any pixel or grabs a section
set(x, y, c)	Sets the color of any pixel
loadPixels()	Loads the pixel data for the display window
updatePixels()	Updates the display window with the data in pixels[]
🌀 Transformations

Function	Description
translate(x, y)	Moves the origin to a new location
rotate(angle)	Rotates the canvas by a given angle
scale(s)	Increases or decreases the size of the canvas
push()	Saves the current drawing style settings
pop()	Restores the settings