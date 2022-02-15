<template>
    <div id="slice_container">
        <div class="bottom">
            <el-input-number v-model="sliceIndex" :step="1" :max="4000" :min="1"></el-input-number>
            <el-button style="margin-left: 10px;" round type="primary" @click="showSliceDetail">查看切片</el-button>
        </div>
    </div>
</template>

<script>
    import * as THREE from "three";
    import OrbitControls from "three-orbitcontrols";

    export default {
        name: "SliceShow",
        props: ['conn'],
        data() {
            return {
                sliceIndex: 1,

                width: 0,
                height: 0,

                container: undefined,
                heatmap: undefined,
                scene: undefined,
                camera: undefined,
                group: undefined,
                renderer: undefined,

                originTemperature: 1601,
                points: undefined,
                positions: [],
                colors: [],
                sliceWidth: 0,
                sliceHeight: 0,
                scaleFactor: 5,
            }
        },
        methods: {
            init: function () {
                this.scene = new THREE.Scene()
                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 0, 1700);
                this.scene.add(new THREE.AmbientLight(0xffffff))
                this.scene.background = new THREE.Color(0x050505)

                this.group = new THREE.Group()
                this.scene.add(this.group)

                this.renderer = new THREE.WebGLRenderer()
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.renderer.setSize(this.width, this.height)

                this.heatmap = this.createPalette()
                for (let canvas of this.heatmap.canvas) {
                    this.container.appendChild(canvas)
                }
                this.buildShapesInit(this.sliceWidth, this.sliceHeight)
                this.container.appendChild(this.renderer.domElement)

                let controls = new OrbitControls(this.camera, this.renderer.domElement)
                controls.addEventListener('change', this.render)

                window.addEventListener('resize', this.onWindowResize, false)
            },
            buildShapesInit: function (width, height) {
                let hw = width * this.scaleFactor / 2
                let hh = height * this.scaleFactor / 2
                let colors = []
                let positions = []
                let m = this.sliceHeight
                let n = this.sliceWidth
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        positions.push(j * this.scaleFactor - hw, i * this.scaleFactor - hh, 0)
                        const arr = this.heatmap.pickColor(1)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255
                        colors.push(vx, vy, vz)
                    }
                }
                this.positions = positions
                this.colors = colors
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: 11, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
            },
            buildShapes: function (data, width, height) {
                let m = data.length
                if (m === 0) {
                    return
                }
                let n = data[0].length
                if (n === 0) {
                    return
                }
                console.log(m, n)
                if (data[0][0] === -1) { // 为空
                    return
                }

                let hw = width * this.scaleFactor / 2
                let hh = height * this.scaleFactor / 2
                let colors = []
                let positions = []

                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        positions.push(j * this.scaleFactor - hw, i * this.scaleFactor - hh, 0)
                        const arr = this.heatmap.pickColor(Math.floor(data[i][j]) % this.originTemperature)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255
                        colors.push(vx, vy, vz)
                    }
                }
                this.positions = positions
                this.colors = colors
                this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                this.points.geometry.computeBoundingSphere();
            },
            createPalette: function () {
                //颜色条的颜色分布
                let data1 = this.createPaletteHelper({
                    1.0: "#388E3C",
                    0.5: "#536DFE",
                    0.0: "#212121",
                }, [
                    {char: "800", x: 70, y: 790},
                    {char: "600", x: 70, y: 600},
                    {char: "400", x: 70, y: 400},
                    {char: "200", x: 70, y: 200},
                    {char: "0", x: 70, y: 0},
                ], "0", "0")

                let data2 = this.createPaletteHelper({
                    1.0: "#D32F2F",
                    0.5: "#FFC107",
                    0.0: "#388E3C",
                }, [
                    {char: "1600", x: 5, y: 790},
                    {char: "1400", x: 5, y: 600},
                    {char: "1200", x: 5, y: 400},
                    {char: "1000", x: 5, y: 200},
                    {char: "800", x: 5, y: 0},
                ], "", "0", "0")

                return {
                    canvas: [data1.canvas, data2.canvas],
                    pickColor: function (position) {
                        if (position > 800) {
                            position = 10 + position - 800
                            return data2.colorData.slice(position * 400, position * 400 + 3)
                        } else {
                            return data1.colorData.slice(position * 400, position * 400 + 3)
                        }
                    }
                }
            },
            createPaletteHelper: function (colorStops, texts, left, top, right) {
                //颜色条的大小
                let width = 100, height = 810

                // 创建canvas
                let paletteCanvas = document.createElement("canvas")
                paletteCanvas.width = width
                paletteCanvas.height = height
                paletteCanvas.style.position = 'absolute'
                paletteCanvas.style.top = top
                paletteCanvas.style.left = left
                paletteCanvas.style.right = right
                let ctx = paletteCanvas.getContext("2d")

                // 创建线性渐变色
                let linearGradient = ctx.createLinearGradient(0, 0, 0, height)
                for (let key in colorStops) {
                    linearGradient.addColorStop(parseFloat(key), colorStops[key])
                }

                // 绘制渐变色条
                ctx.fillStyle = linearGradient
                ctx.fillRect(0, 0, width, height)

                ctx.font = '10px "微软雅黑"'
                ctx.fillStyle = "white"
                ctx.textBaseline = "top"
                for (let text of texts) {
                    ctx.fillText(text.char, text.x, text.y)
                }

                return {colorData: ctx.getImageData(0, 0, width, height).data, canvas: paletteCanvas}
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
            showSliceDetail: function () {
                console.log(this.sliceIndex)
                let message = {
                    type: "start_push_slice_detail",
                    content: String(this.sliceIndex - 1)
                }
                if (this.conn !== undefined) {
                    this.conn.send(JSON.stringify(message));
                    console.log("showSliceDetail")
                }
            }
        },
        mounted() {
            this.container = document.getElementById("slice_container")
            this.width = this.container.clientWidth
            this.height = this.container.clientHeight
            console.log(this.width, this.height)

            this.sliceWidth = 540
            this.sliceHeight = 84
            this.init()
            this.animate()

            let self = this
            this.$root.$on("new_slice_detail", (data) => {
                self.buildShapes(data, self.sliceWidth, self.sliceHeight)
            })

            this.$root.$on("open_dialog", () => {
                self.showSliceDetail()
            })

            this.showSliceDetail()
        }
    }
</script>

<style scoped>
    #slice_container {
        width: 100%;
        height: calc(100vh - 60px);
        border: 1px solid #ddd;
        position: relative;
    }

    .bottom {
        position: absolute;
        text-align: center;
        z-index: 999;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
    }
</style>