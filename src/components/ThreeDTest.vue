<template>
    <div id="container">
    </div>
</template>

<script>
    import * as THREE from 'three'
    import OrbitControls from 'three-orbitcontrols'

    export default {
        name: "ThreeDTest",
        data() {
            return {
                scene: undefined,
                camera: undefined,
                renderer: undefined,
                geometry: undefined,
                material: undefined,
                group: undefined,
                positions: [],
                colors: [],
                w: 256,
                h: 256,

                container: undefined,
                width: 0,
                height: 0,

                points: undefined,
                change: false,
            }
        },
        methods: {
            init: function () {
                this.scene = new THREE.Scene()

                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 150, 1200);

                this.scene.add(new THREE.AmbientLight(0xffffff))

                this.scene.background = new THREE.Color(0x050505)

                this.group = new THREE.Group()
                this.group.position.set(-300, -250, 0)
                this.scene.add(this.group)

                this.heatmap = this.createPalette()

                this.buildShapes()

                this.renderer = new THREE.WebGLRenderer()
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.renderer.setSize(this.width, this.height)
                this.container.appendChild(this.heatmap.canvas)
                this.container.appendChild(this.renderer.domElement)

                let controls = new OrbitControls(this.camera, this.renderer.domElement)
                controls.addEventListener('change', this.render)

                window.addEventListener('resize', this.onWindowResize, false)
            },
            onWindowResize: function () {
                this.camera.aspect = this.width / this.height
                this.camera.updateProjectionMatrix()

                this.renderer.setSize(this.width, this.height)
            },
            animate: function () {
                requestAnimationFrame(this.animate)
                this.render()
            },
            render: function () {
                this.renderer.render(this.scene, this.camera)
            },
            createPalette: function () {
                //颜色条的颜色分布
                let colorStops = {
                    1.0: "#D32F2F",
                    0.75: "#FFC107",
                    0.5: "#388E3C",
                    0.25: "#536DFE",
                    0.0: "#515151"
                }

                //颜色条的大小
                let width = 100, height = 700

                // 创建canvas
                let paletteCanvas = document.createElement("canvas")
                paletteCanvas.width = width
                paletteCanvas.height = height
                paletteCanvas.style.position = 'absolute'
                paletteCanvas.style.top = '0'
                paletteCanvas.style.left = '0'
                let ctx = paletteCanvas.getContext("2d")

                // 创建线性渐变色
                let linearGradient = ctx.createLinearGradient(0, 0, 0, height)
                for (const key in colorStops) {
                    linearGradient.addColorStop(parseFloat(key), colorStops[key])
                }

                // 绘制渐变色条
                ctx.fillStyle = linearGradient
                ctx.fillRect(0, 0, width, height)

                ctx.font = '10px "微软雅黑"'
                ctx.fillStyle = "white"
                ctx.textBaseline = "top"
                ctx.fillText("1600", 70, 690)
                ctx.fillText("1250", 70, 515)
                ctx.fillText("900", 70, 340)
                ctx.fillText("550", 70, 165)
                ctx.fillText("200", 70, 0)

                let imageData = ctx.getImageData(0, 0, width, height).data

                return {
                    canvas: paletteCanvas,
                    pickColor: function (position) {
                        return imageData.slice(position * 400, position * 400 + 3)
                    }
                }
            },
            buildShapes: function () {
                let r = parseFloat((600 * 4 / (Math.PI * 2)).toFixed(4))
                let rOut = r + 420 / 5 / 2
                let rIn = r - 420 / 5 / 2

                let color = 0xdddddd
                // outline
                this.buildOutlineShapeUp(rOut, color)
                this.buildOutlineCurve(rOut, rIn, color)
                this.buildOutlineShapeDown(rOut, color)

                // internal
                this.buildInternalShapes(rOut, rIn)
            },
            buildOutlineCurve: function (rOut, rIn, color) {
                let angle = 90
                let step = 90 / 600
                let pts1 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts1.push(new THREE.Vector3(xy.x2, xy.y2, 270))  // this is the key operation
                }
                let geometry1 = new THREE.BufferGeometry().setFromPoints(pts1);
                let arc1 = new THREE.Line(geometry1, new THREE.LineBasicMaterial({
                    color: color
                }));

                this.group.add(arc1)

                let pts2 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rOut, (angle - i * step) - 180)
                    pts2.push(new THREE.Vector3(xy.x2, xy.y2, -270))  // this is the key operation
                }
                let geometry2 = new THREE.BufferGeometry().setFromPoints(pts2);
                let arc2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial({
                    color: color
                }));

                this.group.add(arc2)

                let pts3 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts3.push(new THREE.Vector3(xy.x2, xy.y2, 270))  // this is the key operation
                }
                let geometry3 = new THREE.BufferGeometry().setFromPoints(pts3);
                let arc3 = new THREE.Line(geometry3, new THREE.LineBasicMaterial({
                    color: color
                }));

                this.group.add(arc3)

                let pts4 = []
                for (let i = 0; i < 600; i++) {
                    let xy = this.calculateXY(rOut, rOut, rIn, (angle - i * step) - 180)
                    pts4.push(new THREE.Vector3(xy.x2, xy.y2, -270))  // this is the key operation
                }
                let geometry4 = new THREE.BufferGeometry().setFromPoints(pts4);
                let arc4 = new THREE.Line(geometry4, new THREE.LineBasicMaterial({
                    color: color
                }));

                this.group.add(arc4)
            },
            buildOutlineShapeUp: function (rOut, color) {

                const shape = new THREE.Shape()
                    .moveTo(0, rOut + 200)
                    .lineTo(84, rOut + 200)
                    .lineTo(84, rOut)
                    .lineTo(0, rOut)
                    .lineTo(0, rOut + 200);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial({color: color}));
                line1.position.set(0, 0, -270);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial({color: color}));
                line2.position.set(0, 0, 270);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(0, rOut + 200, 270))
                points1.push(new THREE.Vector3(0, rOut + 200, -270))
                this.group.add(this.setLine(points1, color))

                let points2 = []
                points2.push(new THREE.Vector3(0, rOut, 270))
                points2.push(new THREE.Vector3(0, rOut, -270))
                this.group.add(this.setLine(points2, color))

                let points3 = []
                points3.push(new THREE.Vector3(84, rOut + 200, 270))
                points3.push(new THREE.Vector3(84, rOut + 200, -270))
                this.group.add(this.setLine(points3, color))

                let points4 = []
                points4.push(new THREE.Vector3(84, rOut, 270))
                points4.push(new THREE.Vector3(84, rOut, -270))
                this.group.add(this.setLine(points4, color))
            },
            buildOutlineShapeDown: function (rOut, color) {

                const shape = new THREE.Shape()
                    .moveTo(rOut, 0)
                    .lineTo(rOut + 200, 0)
                    .lineTo(rOut + 200, 84)
                    .lineTo(rOut, 84)
                    .lineTo(rOut, 0);

                const points = shape.getPoints();
                const geometryPoints = new THREE.BufferGeometry().setFromPoints(points);

                let line1 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial({color: color}));
                line1.position.set(0, 0, -270);
                this.group.add(line1);

                let line2 = new THREE.Line(geometryPoints, new THREE.LineBasicMaterial({color: color}));
                line2.position.set(0, 0, 270);
                this.group.add(line2);

                let points1 = []
                points1.push(new THREE.Vector3(rOut + 200, 0, 270))
                points1.push(new THREE.Vector3(rOut + 200, 0, -270))
                this.group.add(this.setLine(points1, color))

                let points2 = []
                points2.push(new THREE.Vector3(rOut, 0, 270))
                points2.push(new THREE.Vector3(rOut, 0, -270))
                this.group.add(this.setLine(points2, color))

                let points3 = []
                points3.push(new THREE.Vector3(rOut + 200, 84, 270))
                points3.push(new THREE.Vector3(rOut + 200, 84, -270))
                this.group.add(this.setLine(points3, color))

                let points4 = []
                points4.push(new THREE.Vector3(rOut, 84, 270))
                points4.push(new THREE.Vector3(rOut, 84, -270))
                this.group.add(this.setLine(points4, color))
            },
            setLine: function (points, color) {
                const material = new THREE.LineBasicMaterial({ //0xf55600
                    color: color
                });
                const geometry = new THREE.BufferGeometry().setFromPoints(points)
                return new THREE.Line(geometry, material)
            },
            buildInternalShapes: function (rOut, rIn) {
                let n = 420 / 5
                let m = 200
                let k = 2700 / 5
                let a = 600
                let hk = k / 2

                { // 结晶器部分
                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const x = i
                            const y = rOut + j
                            this.positions.push(x, y, hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < n; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const x = i
                            const y = rOut + j
                            this.positions.push(x, y, -hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const y = rOut + j

                            this.positions.push(n, y, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const y = rOut + j

                            this.positions.push(0, y, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const z = i - hk

                            this.positions.push(j, rOut + m, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 弧形部分
                    for (let i = 0; i < n; i++) {
                        let r = rOut - i
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, r, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < n; i++) {
                        let r = rOut - i
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, r, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, -hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, rOut, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, i - hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < a; j++) {
                            let angle = 90
                            let step = 90 / a
                            // positions
                            let xy = this.calculateXY(rOut, rOut, rIn, (angle - j * step) - 180)
                            const x = xy.x2
                            const y = xy.y2
                            this.positions.push(x, y, i - hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                { // 出口部分
                    for (let i = 0; i < m; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const x = rOut + i
                            this.positions.push(x, j, hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)
                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < m; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const x = rOut + i
                            this.positions.push(x, j, -hk)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }

                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const x = rOut + j

                            this.positions.push(x, 0, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < m; j++) {
                            // positions
                            const z = i - hk
                            const x = rOut + j

                            this.positions.push(x, n, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                    for (let i = 0; i < k; i++) {
                        for (let j = 0; j < n; j++) {
                            // positions
                            const z = i - hk

                            this.positions.push(rOut + m, j, z)

                            // colors
                            const arr = this.heatmap.pickColor((i + j) % 699)

                            const vx = arr[0] / 255
                            const vy = arr[1] / 255
                            const vz = arr[2] / 255

                            this.colors.push(vx, vy, vz)
                        }
                    }
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 2, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
            },
            calculateXY: function (x1, y1, r, angle) {
                return {
                    x2: x1 + r * Math.cos(angle * Math.PI / 180),
                    y2: y1 + r * Math.sin(angle * Math.PI / 180)
                }
            },
            setLoop: function () {
                let self = this
                if (!this.change) {
                    setInterval(function () {
                        let start = new Date().getTime()
                        for (let i = 0; i < self.colors.length; i++) {
                            self.colors[i] = self.colors[i] + (10 / 255)
                        }
                        self.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(self.colors, 3))
                        let end = new Date().getTime()
                        console.log(end - start)
                        self.points.geometry.computeBoundingSphere();
                    }, 2000)
                    this.change = true
                }
            }
        },
        mounted() {
            this.container = document.getElementById("container")
            this.width = this.container.clientWidth
            this.height = this.container.clientHeight

            this.init()
            this.animate()
            // let self = this
            // setInterval(function () {
            //     let start = new Date().getTime()
            //     self.$worker.run((colors) => {
            //         for (let i = 0; i < colors.length; i++) {
            //             colors[i] = colors[i] + (50 / 255)
            //         }
            //         return colors
            //     }, [self.colors]).then(res => {
            //         let start = new Date().getTime()
            //         self.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(res, 3))
            //         self.colors = res
            //         let end = new Date().getTime()
            //         console.log(end - start, "inner")
            //     })
            //     let end = new Date().getTime()
            //     console.log(end - start, "outer")
            // }, 2000)
            // this.setLoop()
        }
    }
</script>

<style scoped>
    #container {
        width: 100%;
        height: 100%;
        position: relative;
    }
</style>