<template>
    <el-form :model="form" :rules="rules" label-width="auto" ref="ruleForm" style="padding: 20px 0;">
        <div style="height: 100%">
            <div class="group">
                <el-form-item label="选择铸机" prop="machineValue">
                    <el-select size="small" v-model="form.machineValue" placeholder="请选择" @change="selectCaster">
                        <el-option
                                v-for="item in form.machineOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                    <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                               size="mini" type="primary"
                               @click="changeMachine">更换铸机
                    </el-button>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="选择钢种" prop="steelValue">
                    <el-select size="small" v-model="form.steelValue" placeholder="请选择">
                        <el-option
                                v-for="item in form.steelOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                    <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                               type="primary" size="mini"
                               @click="addSteelType">添加钢种
                    </el-button>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="浇注温度" prop="startTemperature">
                    <el-input-number size="small" v-model="form.startTemperature" :precision="2" :step="1"
                                     :max="1600" :min="200"></el-input-number>
                    <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                               size="mini" type="primary"
                               icon="el-icon-right"
                               @click="changeInitialTemp"></el-button>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="弯月面高度" prop="levelHeight">
                    <el-input-number size="small" v-model="form.levelHeight" :precision="2" :step="1"
                                     :max="200" :min="0"></el-input-number>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="计算方式" prop="calculateMethodValue">
                    <el-select size="small" v-model="form.calculateMethodValue" placeholder="请选择">
                        <el-option
                                v-for="item in form.calculateMethods"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="是否存在电磁制动/搅拌">
                    <el-checkbox v-model="form.is_electromag_brake">电磁制动</el-checkbox>
                    <el-checkbox v-model="form.is_electromag_stir">电磁搅拌</el-checkbox>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="拉速" prop="dragSpeed">
                    <el-input-number size="small" v-model="form.dragSpeed" :precision="2" :step="0.1" :min="1.5"
                                     :max="150"></el-input-number>
                    <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                               size="mini" type="primary"
                               icon="el-icon-right"
                               @click="changeV"></el-button>
                </el-form-item>
            </div>

            <div class="group">
                <el-form-item label="结晶器铜板窄面">
                    <el-col :span="12">
                        <el-form-item prop="narrowSurfaceIn" label="进水温度℃">
                            <el-input-number size="small" v-model="form.md.narrow_surface_in" :precision="2" :step="1"
                                             :min="20" :max="100"
                                             placeholder="进水温度"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="narrowSurfaceOut" label="出水温度℃">
                            <el-input-number size="small" v-model="form.md.narrow_surface_out" :precision="2" :step="1"
                                             :min="20" :max="100"
                                             placeholder="出水温度"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="narrowSurfaceVolume" label="水量L/min">
                            <el-input-number size="small" v-model="form.md.narrow_surface_volume" :precision="2"
                                             :step="1"
                                             :min="0"
                                             placeholder="水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                                   size="mini" type="primary"
                                   icon="el-icon-right"
                                   @click="changeNarrowSurface"></el-button>
                    </el-col>
                </el-form-item>
                <el-form-item label="结晶器铜板宽面">
                    <el-col :span="12">
                        <el-form-item prop="wideSurfaceIn" label="进水温度℃">
                            <el-input-number size="small" v-model="form.md.wide_surface_in" :precision="2" :step="1"
                                             :min="20" :max="100"
                                             placeholder="进水温度"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="wideSurfaceOut" label="出水温度℃">
                            <el-input-number size="small" v-model="form.md.wide_surface_out" :precision="2" :step="1"
                                             :min="0" :max="100"
                                             placeholder="出水温度"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="wideSurfaceVolume" label="水量L/min">
                            <el-input-number size="small" v-model="form.md.wide_surface_volume" :precision="2" :step="1"
                                             :min="0"
                                             placeholder="水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                                   size="mini" type="primary"
                                   icon="el-icon-right"
                                   @click="changeWideSurface"></el-button>
                    </el-col>
                </el-form-item>
            </div>

            <div class="group" v-for="item in casterCfg.cooling_zone" :key="item.zone_name">
                <el-form-item :label="item.zone_name">
                    <el-col :span="10">
                        <el-form-item label="喷淋水温度">
                            <el-input-number size="small" :precision="2" :step="1"
                                             v-model="item.spray_water_temperature"
                                             placeholder="水温"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="内弧中心水量">
                            <el-input-number size="small" :precision="2" :step="1" v-model="item.inner_arc_volume"
                                             placeholder="内弧中心水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="幅切1水量">
                            <el-input-number size="small" :precision="2" :step="1" v-model="item.fuqie_1_volume"
                                             placeholder="幅切1水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="幅切2水量">
                            <el-input-number size="small" :precision="2" :step="1" v-model="item.fuqie_2_volume"
                                             placeholder="幅切2水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col v-if="item.narrow_side_volume !== 0" :span="10">
                        <el-form-item label="窄面水量">
                            <el-input-number size="small" :precision="2" :step="1" v-model="item.narrow_side_volume"
                                             placeholder="窄面水量"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-button class="item-button" v-show="calculationStarted" :disabled="!calculationStarted"
                                   size="mini" type="primary"
                                   icon="el-icon-right"
                                   @click="change(item)"></el-button>
                    </el-col>
                </el-form-item>
            </div>
            <!-- 暂时没有用到 -->
            <div class="group">
                <el-form-item label="计算水表的拉速范围">
                    <el-col :span="8">
                        <el-input-number v-model="form.speed2Water.top" size="small" :precision="2"
                                         :step="form.speed2Water.step"
                                         :min="form.speed2Water.bottom" :max="3.00" placeholder="上限"></el-input-number>
                    </el-col>
                    <el-col :span="8">
                        <el-input-number v-model="form.speed2Water.bottom" size="small" :precision="2"
                                         :step="form.speed2Water.step"
                                         :max="form.speed2Water.top" placeholder="下限"></el-input-number>
                    </el-col>
                    <el-col :span="8">
                        <el-input-number v-model="form.speed2Water.step" size="small" :precision="2" :step="0.1"
                                         :min="0.00"
                                         :max="1.00" placeholder="增量"></el-input-number>
                    </el-col>
                </el-form-item>
            </div>

            <div style="height: 100px;"></div>

            <div id="operations">
                <el-button :round="true" size="small" type="primary" :disabled="calculationStarted"
                           @click="setCalculateEnv('ruleForm')">设置计算环境
                </el-button>
                <el-button :round="true" size="small" type="success" @click="startCalculate"
                           :disabled="!envSet || calculationStarted">开始计算
                </el-button>
                <el-button :round="true" size="small" type="danger" @click="stopCalculate"
                           :disabled="!calculationStarted">停止计算
                </el-button>
                <el-button :round="true" size="small" type="warning" @click="showDetailSlice()"
                           :disabled="!calculationStarted">查看切片温度详情
                </el-button>
                <el-button :round="true" size="small" type="warning" @click="showDetailCurves"
                           :disabled="!calculationStarted">查看纵切面温度分布
                </el-button>
                <el-button :round="true" size="small" type="warning" @click="startTail" :disabled="!calculationStarted">
                    拉尾坯
                </el-button>
                <el-button :round="true" size="small" type="warning" @click="generateData"
                           :disabled="calculationStarted">
                    测试
                </el-button>
            </div>

        </div>
    </el-form>
</template>

<script>
    export default {
        name: "Form",
        data() {
            return {
                connection: null,
                envSet: false,
                calculationStarted: false,
                casterCfg: {},
                form: {
                    machineOptions: [{
                        value: "caster",
                        label: '铸机14-20-7'
                    }],
                    machineValue: undefined,
                    steelOptions: [{
                        value: 1,
                        label: 'Q345B'
                    }],
                    steelValue: undefined,
                    is_electromag_brake: false,
                    is_electromag_stir: false,
                    startTemperature: 1530.00,
                    levelHeight: 100,
                    md: {
                        narrow_surface_in: 33.00,
                        narrow_surface_out: 40.00,
                        narrow_surface_volume: 500.00,
                        wide_surface_in: 33.00,
                        wide_surface_out: 40.00,
                        wide_surface_volume: 3000.00,
                    },
                    dragSpeed: 1.50,
                    calculateMethods: [{
                        value: 1,
                        label: '用温度计算'
                    }, {
                        value: 2,
                        label: '用水量计算'
                    }],
                    calculateMethodValue: 1,
                    speed2Water: {
                        top: undefined,
                        bottom: undefined,
                        step: undefined,
                    }
                },
                rules: {
                    machineValue: [
                        {required: true, message: '请选择铸机', trigger: 'change'},
                    ],
                    steelValue: [
                        {required: true, message: '请选择钢种', trigger: 'change'},
                    ],
                    startTemperature: [
                        {required: true, message: '请输入温度', trigger: 'blur'},
                        {type: 'number', min: 0, max: 2000, message: '温度在 0 到 2000之间', trigger: 'blur'}
                    ],
                    levelHeight: [
                        {required: true, message: '请输入弯月面高度', trigger: 'blur'},
                    ],
                    dragSpeed: [
                        {required: true, message: '请输入速度', trigger: 'blur'},
                        {type: 'number', min: 1.5, max: 150, message: '速度在 1.5 到 150之间', trigger: 'blur'}
                    ],
                }
            }
        },
        methods: {
            change: function (item) {
                // todo
                console.log(item)
            },
            selectCaster: function (caster) {
                console.log(caster)
                let message = {
                    type: "select_caster",
                    content: caster,
                }
                this.connection.send(JSON.stringify(message));
            },
            changeMachine: function () {
                console.log(this.form.machineValue)
            },
            addSteelType: function () {
                console.log(this.form.steelValue)
            },
            changeInitialTemp: function () {
                let message = {
                    type: "change_initial_temp",
                    content: String(this.form.startTemperature),
                }
                this.connection.send(JSON.stringify(message));
            },
            changeNarrowSurface: function () {
                let narrowSurface = {
                    in: this.form.md.narrowSurfaceIn,
                    out: this.form.md.narrowSurfaceOut,
                    volume: this.form.md.narrowSurfaceVolume
                }
                let message = {
                    type: "change_narrow_surface",
                    content: JSON.stringify(narrowSurface)
                }
                this.connection.send(JSON.stringify(message));
            },
            changeWideSurface: function () {
                let wideSurface = {
                    in: this.form.md.wideSurfaceIn,
                    out: this.form.md.wideSurfaceOut,
                    volume: this.form.md.wideSurfaceVolume
                }
                let message = {
                    type: "change_wide_surface",
                    content: JSON.stringify(wideSurface)
                }
                this.connection.send(JSON.stringify(message));
            },
            changeV: function () {
                let message = {
                    type: "change_v",
                    content: String(this.form.dragSpeed),
                }
                this.connection.send(JSON.stringify(message));
            },
            setCalculateEnv: function (formName) {
                console.log(this.form)
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        let coolingWaterSections = []
                        for (let i = 0; i < this.casterCfg.cooling_zone.length; i++) {
                            coolingWaterSections.push(
                                {
                                    spray_water_temperature: this.casterCfg.cooling_zone[i].spray_water_temperature,
                                    inner_arc_water_volume: this.casterCfg.cooling_zone[i].inner_arc_volume,
                                    narrow_side_water_volume: this.casterCfg.cooling_zone[i].narrow_side_volume,
                                }
                            )
                        }
                        let env = {
                            level_height: this.form.levelHeight,
                            steel_value: this.form.steelValue,
                            start_temperature: this.form.startTemperature,
                            md: this.form.md,
                            drag_speed: this.form.dragSpeed,
                            coordinate: this.casterCfg.coordinate,
                            secondary_cooling_water_cfg: coolingWaterSections,
                            cooling_zone_cfg: this.casterCfg.cooling_zone
                        }
                        let message = {
                            type: "env",
                            content: JSON.stringify(env)
                        }
                        console.log(message)
                        this.connection.send(JSON.stringify(message))
                    } else {
                        console.log('error submit!!');
                        return false;
                    }
                });
            },
            startCalculate: function () {
                let message = {
                    type: "start",
                    content: "start to calculate"
                }
                this.connection.send(JSON.stringify(message));
            },
            stopCalculate: function () {
                let message = {
                    type: "stop",
                    content: "stop to calculate"
                }
                this.connection.send(JSON.stringify(message));
                console.log("stop to calculate")
            },
            startTail: function () {
                let message = {
                    type: "tail",
                    content: "start to tail"
                }
                this.connection.send(JSON.stringify(message));
            },
            showDetailSlice: function () {
                let config = this.casterCfg
                this.$root.$emit("show_detail_slice", {show: true, config: config, conn: this.connection})
            },
            showDetailCurves: function () {
                let config = this.casterCfg
                this.$root.$emit("show_detail_curves", {show: true, config: config, conn: this.connection})
            },
            generateData: function () {
                let message = {
                    type: "generate",
                    content: "generate_data",
                }
                this.connection.send(JSON.stringify(message));
            }
        },
        created: function () {
            let self = this
            console.log("Starting connection to WebSocket Server")
            self.connection = new WebSocket("ws://localhost:9000/ws")

            self.connection.onmessage = function (event) {
                let data = JSON.parse(event.data)
                // console.log(data)
                switch (data.type) {
                    case "caster_info": {
                        self.casterCfg = JSON.parse(data.content)
                        self.$root.$emit("caster_info", self.casterCfg)
                        break
                    }
                    case "env_set": {
                        self.envSet = true
                        break
                    }
                    case "initial_temp_set": {
                        console.log(data.content)
                        break
                    }
                    case "narrow_surface_temp_set": {
                        console.log(data.content)
                        break
                    }
                    case "wide_surface_temp_set": {
                        console.log(data.content)
                        break
                    }
                    case "v_set": {
                        console.log(data.content)
                        break
                    }
                    case "started": {
                        self.calculationStarted = true
                        break
                    }
                    case "data_push": {
                        let content = JSON.parse(data.content)
                        // console.log(data)
                        self.$root.$emit("new_field_data", content)
                        break
                    }
                    case "stopped": {
                        self.calculationStarted = false
                        break
                    }
                    case "calculating": {
                        console.log(data.content)
                        break
                    }
                    case "tail_start": {
                        console.log(data.content)
                        break
                    }
                    case "slice_detail": {
                        // console.log(data.content)
                        let content = JSON.parse(data.content)
                        self.$root.$emit("new_slice_detail", content)
                        break
                    }
                    case "start_push_slice_detail_success": {
                        console.log(data.content)
                        break
                    }
                    case "stop_push_slice_detail_success": {
                        console.log(data.content)
                        break
                    }
                    case "data_generate": {
                        let content = JSON.parse(data.content)
                        self.$root.$emit("data_generated", content)
                        break
                    }
                    case "slice_generated": {
                        let content = JSON.parse(data.content)
                        self.$root.$emit("slice_generated", content)
                        break
                    }
                    case "vertical_slice1_generated": {
                        let content = JSON.parse(data.content)
                        self.$root.$emit("vertical_slice1_generated", content)
                        break
                    }
                    case "vertical_slice2_generated": {
                        let content = JSON.parse(data.content)
                        self.$root.$emit("vertical_slice2_generated", content)
                        break
                    }
                }
            }

            this.connection.onopen = function (event) {
                console.log(event)
                console.log("Successfully connected to the echo websocket server...")
            }
        }
    }
</script>

<style scoped>
    .el-form {
        height: calc(100vh - 160px);
        max-height: calc(100vh - 160px);
        overflow-y: auto;
        box-sizing: border-box;
    }

    .group {
        padding-top: 15px;
        border-bottom: 1px solid #ddd;
    }

    .item-button {
        margin-left: 15px;
    }

    #operations {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 100px;
        width: 100%;
        box-shadow: rgba(0, 0, 0, 0.51) 0 5px 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        z-index: 100;
        background: white;
    }

    .el-form-item {
        padding: 0 15px;
        text-align: left;
    }
</style>