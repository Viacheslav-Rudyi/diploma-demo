let thingsToLoad = ["assets/Alpaca One.png", "assets/Alpaca One neutral.png", "assets/Alpaca Two.png", "assets/Alpaca Two neutral.png", "assets/sky.png", "assets/Monster.png", "assets/Monster alter.png", "assets/mountain.png", "assets/cave.png", "assets/Unicorn.png", "assets/Unicorn smile.png", "assets/field.png", "scenes/main.json"]

// TODO
/*
Node types to implement:
- Sprites: show character, hide sprite (with emotions)
- Change Background
- Tweens
- define user variables
- IF routes
*/

let metadataString = `
{
    "width": 2560,
    "height": 1440,
	"fullscreen": true
}
`

let metadata = JSON.parse(metadataString)

let messageBox = undefined,
bgSprite = undefined,
choices = undefined,
sprites = undefined,
message,
speaker,
choicesBg = undefined

let activeSprites = new Object()
let spriteProperties = new Object()

let isMessageBoxInteractive = true

let scene
let currentNode
let currentDialogueLine = 0
let tapCountDown = 0

let windowWidth = metadata.width
let windowHeight = metadata.height

let g = hexi(metadata.width, metadata.height, setup, thingsToLoad, load)
g.scaleToWindow()
g.start()


function load(){
	g.loadingBar()
}

function setup() {
    g.fps = 30;
	setScene(g.json("scenes/main.json"))
	currentNode = scene[0]
	
    resolveCurrentNode()
    g.border = "1px solid black"

    g.state = play
	console.log(g.sprite)
}

function play(){
	let hit = detectHitRecursive(g.stage.children)
	// hit == true ? console.log("hit") : console.log("no hit")
}

function setScene(newScene) {
	scene = newScene
	g.stage.removeChildren(0, undefined)

	sprites = g.group()
	g.stage.addChild(sprites)

	messageBox = g.rectangle(windowWidth, windowHeight / 5, "#000000")
    messageBox.alpha = 0.7;
	messageBox.interact = true
	// g.makeInteractive(messageBox);
	isMessageBoxInteractive = true
	messageBox.tap = onMesssageBoxTap;
	messageBox.layer = 10
	g.stage.putBottom(messageBox, 0, -windowHeight / 5)

    message = g.text("Message", "48px garamond", "white")
	message.layer = 11
    g.stage.putBottom(message, 0, -windowHeight / 5)

	speaker = g.text("Speaker", "64px garamond", "white")
	speaker.layer = 12
	g.stage.putBottom(speaker, 0, -windowHeight / 5 + 8)
	speaker.position.x = 128
	
	choices = g.group()
	choices.layer = 12

	g.pointer.tap = handleTapGeneral

	console.log(g.text)
	console.log(g)
}
function setCurrentNode(newNode) {
	if (!newNode) return

	currentNode = newNode
	currentDialogueLine = 0
	tapCountDown = 0
	resolveCurrentNode()
}

function handleTapGeneral() {
	let hit = detectHitRecursive(g.stage.children)
	hit = false
	// hit == true ? console.log("hit") : console.log("no hit")
	if (hit == false && currentNode.type.text == "dialogue") {
		onMesssageBoxTap()
		return
	}
	if (hit == false && currentNode.type.text == "wait") {
		tapCountDown += 1
		if (tapCountDown >= 1) setCurrentNode(scene[currentNode.next.next])
		return
	}
	if (hit == false && currentNode.next.next) {
		setCurrentNode(scene[currentNode.next.next])
	}
}

function detectHitRecursive(that) {
	let nextIter = []
	let result = false
	that.forEach(child => {
		if (g.hit(g.pointer, child) == true) {
			// console.log(child)
			result = true
			if (child === bgSprite) result = false;
		}
		if (child.children.length > 0) nextIter.concat(child.children)
	})
	if (result == true) return result
	if (nextIter.length == 0) return false
	
	return detectHitRecursive(nextIter)
}

function toggleMessageBox(visibility) {
	if (visibility == false) {
		// console.log("box hidden")
		messageBox.interact = false
		messageBox.tap = () => {}
		g.stage.removeChild(messageBox)
		g.stage.removeChild(message)
		g.stage.removeChild(speaker)
	}
	else {
		if (g.stage.children.includes(messageBox) == false) g.stage.addChild(messageBox)
		if (g.stage.children.includes(message) == false) g.stage.addChild(message)
		if (g.stage.children.includes(speaker) == false) g.stage.addChild(speaker)
	}
}

function resolveCurrentNode() {
	// console.log(currentNode)
	messageBox.interact = false
	switch (currentNode.type.text) {
		case "root":
			toggleMessageBox(false)
			setCurrentNode(scene[currentNode.next.next])
			break;
		case "dialogue":
			// isMessageBoxInteractive = true
			toggleMessageBox(true)

			messageBox.interact = true
			message.content = currentNode.text.dialogue[currentDialogueLine];

			g.stage.putBottom(message, 0, -windowHeight / 6.5)

			if (currentNode.speaker.text) {
				speaker.content = currentNode.speaker.text + ":"
			}
			else {
				speaker.content = ""
			}
			g.stage.putBottom(speaker, 0, -windowHeight / 5 + 8)
			speaker.position.x = 256
			break;
		case "choice":
			for (choice in currentNode.choices.choice) {
				let ctext = g.text(currentNode.choices.choice[choice], "36px garamong", "white")
				choices.addChild(ctext)
				ctext.interact = true
				// g.makeInteractive(ctext)
				ctext.tap = onChoiceTap(currentNode.destinations.destination[choice])
			}

			// g.stage.putCenter(choices.children[0])
    		// g.flowDown(10, choices.children)
			for (let i = 1; i < choices.children.length; i += 1) {
				choices.children[i].y = choices.children[i - 1].y + choices.children[i - 1].halfHeight * 2 + 32
			}
			choicesBg = g.rectangle(choices.halfWidth * 4 + 64, choices.halfHeight * 2 + 64, "black")
			choicesBg.alpha = 0.7
			choicesBg.layer = 11
			//g.stage.addChild(choicesBg)
			g.stage.putCenter(choicesBg, 0, -choicesBg.halfHeight + 32)
			g.stage.putCenter(choices, 0, -choices.halfHeight)
			break;
		case "hide messagebox":
			toggleMessageBox(false)
			setCurrentNode(scene[currentNode.next.next])
			break;
		case "show character":
			let spritePath = "assets/"
			if (currentNode.expression.text != "Default") spritePath += currentNode.sprite.text + " " + currentNode.expression.text + ".png"
			else spritePath += currentNode.sprite.text + ".png"
			
			if (currentNode.sprite.text in activeSprites) {
				g.stage.removeChild(activeSprites[currentNode.sprite.text])
			}
			activeSprites[currentNode.sprite.text] = g.sprite(spritePath)
			if (!spriteProperties[currentNode.sprite.text]) spriteProperties[currentNode.sprite.text] = new Object()

			if (currentNode.hasOwnProperty("properties")) {
				for (let prop in currentNode.properties.properties) {
					spriteProperties[currentNode.sprite.text][prop] = currentNode.properties.properties[prop]
				}
			}

			let thisSprite = activeSprites[currentNode.sprite.text]
			thisSprite.pivotX = 0.5
			thisSprite.pivotY = 1

			let thisProperties = spriteProperties[currentNode.sprite.text]
			// console.log(thisProperties)

			thisProperties.x == null ? {} : thisSprite.x = thisProperties.x * windowWidth
			thisProperties.y == null ? thisSprite.y = windowHeight : thisSprite.y = thisProperties.y * windowHeight
			thisProperties.scaleX == null ? {} : thisSprite.scaleX = thisProperties.scaleX / 100
			thisProperties.scaleY == null ? {} : thisSprite.scaleY = thisProperties.scaleY / 100
			thisProperties.scale == null ? {} : (thisSprite.scaleX = thisProperties.scale / 100,
				thisSprite.scaleY = thisProperties.scale
			)
			
			thisSprite.interact = true
			thisSprite.layer = 1

			console.log(activeSprites)
			setCurrentNode(scene[currentNode.next.next])
			break
		case "hide character":
			g.stage.removeChild(activeSprites[currentNode.sprite.text])
			break
		case "set background":
			let bgPath = "assets/" + currentNode.sprite.text + ".png"
			if (bgSprite) g.stage.removeChild(bgSprite)
			bgSprite = g.sprite(bgPath)
			bgSprite.width = windowWidth
			bgSprite.height = windowHeight
			bgSprite.layer = -1
			setCurrentNode(scene[currentNode.next.next])
			break
		case "set background color":
			if (bgSprite) g.stage.removeChild(bgSprite)
			bgSprite = g.rectangle(
				windowWidth,
				windowHeight,
				rgbToHex(
					currentNode.color.rgb[0],
					currentNode.color.rgb[1],
					currentNode.color.rgb[2]
				)
			)
			bgSprite.layer = -1
			setCurrentNode(scene[currentNode.next.next])
			break
		case "wait":
			break
	}
}

function componentToHex(c) {
	c = Math.round(c * 255)
	if (c < 0) {
		c = 0;
	}
	if (c > 255) {
		c = 255
	}
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function onChoiceTap(choiceID) {
	return function() {
		setCurrentNode(scene[choiceID])
		// choices = g.group()
		choices.children.forEach(child => {
			child.tap = () => {}
			child.interact = false
		})
		choices.removeChildren(0, undefined)

		choicesBg.alpha = 0
	}
}

function onMesssageBoxTap() {
	// console.log("message box tapped")
	if (isMessageBoxInteractive == false) return;
	
	let length = currentNode.text.dialogue.length
	if (currentDialogueLine < length - 1) {
		currentDialogueLine += 1
		resolveCurrentNode()
	}
	else {
		if (!currentNode.next.next) return;
		messageBox.interact = false
		setCurrentNode(scene[currentNode.next.next])
	}
}