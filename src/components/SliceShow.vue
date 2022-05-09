<template>
    <div id="slice_container">
        <div class="currentIndex font_glow">
            <span>当前横截面距离液面顶端距离 {{sliceIndex}} mm</span>
        </div>
        <div class="data_info1 font_glow">
            <div>窄边中轴线铸壳厚度：{{HorizontalSolidThickness}}mm / 1260mm</div>
            <br>
            <div>窄边中轴线液相线离边缘距离：{{HorizontalLiquidThickness}}mm / 1260mm</div>
        </div>
        <div class="data_info2 font_glow">
            <div>宽边中轴线铸壳厚度：{{VerticalSolidThickness}}mm / 230mm</div>
            <br>
            <div>宽边中轴线液相线离边缘距离：{{VerticalLiquidThickness}}mm / 230mm</div>
        </div>
        <!--        <div class="bottom">-->
        <!--            <div class="slider_container">-->
        <!--                <div class="block">-->
        <!--                    <span class="demonstration">切片生成进度</span>-->
        <!--                    <el-slider-->
        <!--                            :disabled="true"-->
        <!--                            :max="max"-->
        <!--                            :marks="marks"-->
        <!--                            v-model="sliceLength"-->
        <!--                            :step="1">-->
        <!--                    </el-slider>-->
        <!--                </div>-->
        <!--                <div :style="styleStart" class="mark">{{start === 1 ? "" : start}}</div>-->
        <!--                <div :style="styleEnd" class="mark">{{end === 4000 ? "" : end}}</div>-->
        <!--            </div>-->

        <!--            <el-input-number v-model="sliceIndex" :step="1" :max="sliceLength" :min="1"></el-input-number>-->
        <!--            <el-button style="margin-left: 10px;" round type="primary" @click="showSliceDetail(sliceIndex - 1)">查看切片</el-button>-->
        <!--        </div>-->
        <div class="bottom">
            <div class="slider_container">
                <div class="block">
                    <span class="demonstration">分区信息</span>
                    <el-slider
                            :max="max"
                            :marks="marks"
                            v-model="sliceIndex"
                            :step="1">
                    </el-slider>
                </div>
            </div>
            <div class="operation">
                <el-input-number size="mini" v-model="sliceIndex" :step="1" :max="max" :min="0"></el-input-number>
                <el-button size="mini" style="margin-left: 10px;" round type="primary"
                           @click="showSliceDetail(sliceIndex)">查看距离液面距离对应的横截面
                </el-button>
            </div>
        </div>
        <div class="temp font_glow">
            当前点温度：{{ pointTemp.toFixed(4) }} ℃
        </div>
    </div>
</template>

<script>
    import * as THREE from "three";
    // import OrbitControls from "three-orbitcontrols";

    export default {
        name: "SliceShow",
        props: ['conn', 'config'],
        data() {
            return {
                sliceLength: 100,
                marks: {
                    0: '',
                },
                max: 0,
                min: 0,
                cap: 0,
                styleStart: "",
                styleEnd: "",

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
                temps: [],
                sliceWidth: 0,
                sliceHeight: 0,
                scaleFactor: 5,
                // slice info data
                HorizontalSolidThickness: 0,
                HorizontalLiquidThickness: 0,
                VerticalSolidThickness: 0,
                VerticalLiquidThickness: 0,

                raycaster: undefined,
                pointer: undefined,
                intersects: undefined,
                INTERSECTED: null,
                PARTICLE_SIZE: 10.8,
                pointTemp: 0,
            }
        },
        methods: {
            init: function () {
                this.scene = new THREE.Scene()
                this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10000)
                this.camera.position.set(0, 0, 800);
                this.scene.add(new THREE.AmbientLight(0xffffff))
                this.scene.background = new THREE.Color(0xffffff)

                this.group = new THREE.Group()
                this.scene.add(this.group)

                this.renderer = new THREE.WebGLRenderer()
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.renderer.setSize(this.width, this.height)

                this.heatmap = this.createPalette()
                for (let canvas of this.heatmap.canvas) {
                    this.container.appendChild(canvas)
                }
                this.buildShapesInit()
                this.container.appendChild(this.renderer.domElement)

                // let controls = new OrbitControls(this.camera, this.renderer.domElement)
                // controls.addEventListener('change', this.render)

                this.raycaster = new THREE.Raycaster()
                this.pointer = new THREE.Vector2()

                window.addEventListener('resize', this.onWindowResize, false)
                this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
            },
            onPointerMove: function (event) {
                this.pointer.x = (event.clientX / (window.innerWidth )) * 2 - 1;
                this.pointer.y = -(event.clientY / (window.innerHeight)) * 2 + 1;
            },
            buildShapesInit: function () {
                let colors = []
                let positions = []
                let temps = []
                let m = this.sliceHeight
                let n = this.sliceWidth
                let hh = m / 2
                let hw = n / 2
                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        positions.push(j - hw, i - hh, 0)
                        const arr = this.heatmap.pickColor(1)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255
                        colors.push(vx, vy, vz)
                        temps.push(this.pointTemp)
                    }
                }
                this.positions = positions
                this.colors = colors
                this.temps = temps
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                geometry.setAttribute('temp', new THREE.Float32BufferAttribute(this.temps, 1));
                geometry.computeBoundingSphere();
                const material = new THREE.PointsMaterial({size: this.PARTICLE_SIZE, vertexColors: true});
                this.points = new THREE.Points(geometry, material);
                this.group.add(this.points)
            },
            buildShapes: function (data) {
                let m = data.length
                if (m === 0) {
                    return
                }
                let n = data[0].length
                if (n === 0) {
                    return
                }
                if (data[0][0] === -1) { // 为空
                    return
                }
                let hh = m * this.scaleFactor / 2
                let hw = n * this.scaleFactor / 2
                let colors = []
                let positions = []
                let temps = []

                for (let i = 0; i < m; i++) {
                    for (let j = 0; j < n; j++) {
                        positions.push(j * this.scaleFactor - hw, i * this.scaleFactor - hh, 0)
                        const arr = this.heatmap.pickColor(Math.floor(data[i][j]) % this.originTemperature)
                        const vx = arr[0] / 255
                        const vy = arr[1] / 255
                        const vz = arr[2] / 255
                        colors.push(vx, vy, vz)
                        temps.push(data[i][j])
                    }
                }
                this.positions = positions
                this.colors = colors
                this.temps = temps
                this.points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
                this.points.geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
                this.points.geometry.setAttribute('temp', new THREE.Float32BufferAttribute(this.temps, 1));
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
                let width = 100, height = 820

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

                ctx.font = '16px "微软雅黑"'
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
                const geometry = this.points.geometry;
                const attributes = geometry.attributes;

                this.raycaster.setFromCamera(this.pointer, this.camera);

                this.intersects = this.raycaster.intersectObject(this.points);

                if (this.intersects.length > 0) {
                    if (this.INTERSECTED !== this.intersects[0].index) {
                        this.INTERSECTED = this.intersects[0].index
                        this.pointTemp = attributes.temp.array[this.INTERSECTED]
                    }

                } else if (this.INTERSECTED !== null) {
                    this.INTERSECTED = null;
                }
                this.renderer.render(this.scene, this.camera)
            },
            showSliceDetail: function (index) {
                console.log(this.sliceIndex)
                // let message = {
                //     type: "start_push_slice_detail",
                //     content: String(index)
                // }
                index = index / 10 - 1
                let message = {
                    type: "generate_slice",
                    content: String(index)
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
            console.log(this.config)
            this.sliceWidth = this.config.cross_profile.length
            this.sliceHeight = this.config.cross_profile.width
            this.init()
            this.animate()

            this.max = this.config.coordinate.z_length
            // md
            this.marks[0] = 'md'
            let index = 0
            let roller = {}
            for (let i = 0; i < this.config.cooling_zone.length; i++) {
                index = this.config.cooling_zone[i].start - 1
                roller = this.config.secondary_cooling_zone[index]
                this.marks[roller.distance] = '' + (i + 1)
            }

            console.log(this.marks)

            let self = this
            // this.$root.$on("new_slice_detail", (data) => {
            //     self.buildShapes(data.slice, self.sliceWidth, self.sliceHeight)
            //     self.marks = data.marks
            //     self.max = data.end
            //     self.sliceLength = data.current
            // })
            //
            // this.$root.$on("open_dialog", () => {
            //     self.showSliceDetail(this.start)
            // })

            this.$root.$on("slice_generated", (data) => {
                console.log(data, "slice_data")
                self.buildShapes(data.slice, self.sliceWidth, self.sliceHeight)
                self.HorizontalSolidThickness = data.horizontal_solid_thickness
                self.HorizontalLiquidThickness = data.horizontal_liquid_thickness
                self.VerticalSolidThickness = data.vertical_solid_thickness
                self.VerticalLiquidThickness = data.vertical_liquid_thickness
            })

            // this.showSliceDetail(this.start)
        }
    }
</script>

<style scoped>
    #slice_container {
        width: 100%;
        height: calc(100vh - 40px);
        border: 1px solid #ddd;
        position: relative;
    }

    .demonstration {
        display: inline-block;
        padding-top: 5px;
    }

    .currentIndex {
        position: absolute;
        text-align: center;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
        bottom: 120px;
        color: #212121;
        font-size: large;
        font-weight: bold;
    }

    .data_info1 {
        position: absolute;
        left: 20%;
        top: 20%;
        z-index: 999;
        color: #212121;
        font-size: large;
        font-weight: bold;
    }

    .data_info2 {
        position: absolute;
        right: 20%;
        top: 20%;
        z-index: 999;
        color: #212121;
        font-size: large;
        font-weight: bold;
    }

    .data_info div {
        padding: 10px;
    }

    .bottom {
        box-sizing: border-box;
        position: absolute;
        text-align: center;
        width: 100%;
        z-index: 999;
        bottom: 0;
        background: white;
        height: 80px;
    }

    .operation {
        position: absolute;
        left: 50%;
        transform: translate(-50%, 50%);
        bottom: 0;
    }

    .temp {
        position: absolute;
        left: 50%;
        transform: translate(-50%, 50%);
        top: 30%;
        color: #212121;
        font-size: large;
        font-weight: bold;
    }

    .slider_container {
        position: relative;
    }

    .font_glow {
        text-shadow: 0 0 10px #fff
    }
</style>