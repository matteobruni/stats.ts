stats.ts
========

#### JavaScript Performance Monitor ####

This class provides a simple info box that will help you monitor your code performance.

* **FPS** Frames rendered in the last second. The higher the number the better.
* **MS** Milliseconds needed to render a frame. The lower the number the better.
* **MB** MBytes of allocated memory. (Run Chrome with `--enable-precise-memory-info`)
* **CUSTOM** User-defined panel support.

### Screenshots ###

![fps.png](https://raw.githubusercontent.com/matteobruni/stats.ts/main/files/fps.png)
![ms.png](https://raw.githubusercontent.com/matteobruni/stats.ts/main/files/ms.png)
![mb.png](https://raw.githubusercontent.com/matteobruni/stats.ts/main/files/mb.png)
![custom.png](https://raw.githubusercontent.com/matteobruni/stats.ts/main/files/custom.png)

### Installation ###
```bash
npm install stats.ts
```

### Usage ###

```javascript
var stats = new Stats();

stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom

document.body.appendChild(stats.dom);

function animate() {
	stats.begin();

	// monitored code goes here

	stats.end();

	requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

### Bookmarklet ###

You can add this code to any page using the following bookmarklet:

```javascript
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='https://cdn.jsdelivr.net/npm/stats.ts';document.head.appendChild(script);})()
```
