<template>
    <el-form :model="form" :rules="rules" label-width="auto" ref="ruleForm">
        <el-form-item label="选择铸机" prop="machineValue">
            <el-select v-model="form.machineValue" placeholder="请选择">
                <el-option
                        v-for="item in form.machineOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                </el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="选择钢种" prop="steelValue">
            <el-select v-model="form.steelValue" placeholder="请选择">
                <el-option
                        v-for="item in form.steelOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                </el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="浇注温度" prop="startTemperature">
            <el-input-number v-model="form.startTemperature" :precision="2" :step="1" :max="2000"></el-input-number>
        </el-form-item>
        <el-form-item label="铜板窄面 进/出水温度">
            <el-input-number v-model="form.narrowSurface.in" :precision="2" :step="1" :min="0" :max="100"
                             placeholder="进水温度"></el-input-number>
            <el-input-number v-model="form.narrowSurface.out" :precision="2" :step="1" :min="0" :max="100"
                             placeholder="出水温度"></el-input-number>
        </el-form-item>
        <el-form-item label="铜板宽面 进/出水温度">
            <el-input-number v-model="form.wideSurface.in" :precision="2" :step="1" :min="0" :max="100"
                             placeholder="进水温度"></el-input-number>
            <el-input-number v-model="form.wideSurface.out" :precision="2" :step="1" :min="0" :max="100"
                             placeholder="出水温度"></el-input-number>
        </el-form-item>
        <el-form-item label="二冷区喷淋水温度" prop="sprayTemperature">
            <el-input-number v-model="form.sprayTemperature" :precision="2" :step="1" :min="0"
                             :max="100"></el-input-number>
        </el-form-item>
        <el-form-item label="辊子内冷水温度" prop="rollerWaterTemperature">
            <el-input-number v-model="form.rollerWaterTemperature" :precision="2" :min="0" :step="1"
                             :max="100"></el-input-number>
        </el-form-item>
        <el-form-item label="拉速" prop="dragSpeed">
            <el-input-number v-model="form.dragSpeed" :precision="2" :step="0.1" :min="0" :max="3.00"></el-input-number>
        </el-form-item>
        <el-form-item label="计算方式" prop="calculateMethodValue">
            <el-select v-model="form.calculateMethodValue" placeholder="请选择">
                <el-option
                        v-for="item in form.calculateMethods"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
                </el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="计算水表的拉速范围">
            <el-input-number v-model="form.speed2Water.top" size="small" :precision="2" :step="form.speed2Water.step"
                             :min="form.speed2Water.bottom" :max="3.00" placeholder="上限"></el-input-number>
            <el-input-number v-model="form.speed2Water.bottom" size="small" :precision="2" :step="form.speed2Water.step"
                             :max="form.speed2Water.top" placeholder="下限"></el-input-number>
            <el-input-number v-model="form.speed2Water.step" size="small" :precision="2" :step="0.1" :min="0.00"
                             :max="1.00" placeholder="增量"></el-input-number>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="setCalculateEnv('ruleForm')" :disabled="calculationStarted">设置计算参数
            </el-button>
            <el-button type="success" @click="startCalculate" :disabled="!envSet || calculationStarted">开始计算
            </el-button>
            <el-button type="danger" @click="stopCalculate" :disabled="!calculationStarted">停止计算</el-button>
        </el-form-item>
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
                form: {
                    machineOptions: [{
                        value: '1',
                        label: '铸机1'
                    }, {
                        value: '2',
                        label: '铸机2'
                    }, {
                        value: '3',
                        label: '铸机3'
                    }],
                    machineValue: undefined,
                    steelOptions: [{
                        value: '1',
                        label: '钢种1'
                    }, {
                        value: '2',
                        label: '钢种2'
                    }, {
                        value: '3',
                        label: '钢种3'
                    }],
                    steelValue: undefined,
                    startTemperature: 1500.00,
                    narrowSurface: {
                        in: 20.00,
                        out: 50.00,
                    },
                    wideSurface: {
                        in: 20.00,
                        out: 50.00,
                    },
                    sprayTemperature: 20.00,
                    rollerWaterTemperature: 20.00,
                    dragSpeed: 1.50,
                    calculateMethods: [{
                        value: '1',
                        label: '用温度计算'
                    }, {
                        value: '2',
                        label: '用水量计算'
                    }, {
                        value: '3',
                        label: '拉尾坯模式'
                    }, {
                        value: '4',
                        label: '用电磁制动'
                    }, {
                        value: '5',
                        label: '用电磁搅拌'
                    }],
                    calculateMethodValue: undefined,
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
                    sprayTemperature: [
                        {required: true, message: '请输入温度', trigger: 'blur'},
                        {type: 'number', min: 0, max: 100, message: '温度在 0 到 100之间', trigger: 'blur'}
                    ],
                    rollerWaterTemperature: [
                        {required: true, message: '请输入温度', trigger: 'blur'},
                        {type: 'number', min: 0, max: 100, message: '温度在 0 到 100之间', trigger: 'blur'}
                    ],
                    dragSpeed: [
                        {required: true, message: '请输入温度', trigger: 'blur'},
                        {type: 'number', min: 0, max: 100, message: '温度在 0 到 100之间', trigger: 'blur'}
                    ],
                    calculateMethodValue: [
                        {required: true, message: '请选择计算方式', trigger: 'change'},
                    ],
                }
            }
        },
        methods: {
            setCalculateEnv(formName) {
                console.log(this.form)
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        let env = {
                            machineValue: this.form.machineValue,
                            steelValue: this.form.steelValue,
                            startTemperature: this.form.startTemperature,
                            narrowSurface: this.form.narrowSurface,
                            wideSurface: this.form.wideSurface,
                            sprayTemperature: this.form.sprayTemperature,
                            rollerWaterTemperature: this.form.rollerWaterTemperature,
                            dragSpeed: this.form.dragSpeed,
                            calculateMethodValue: this.form.calculateMethodValue,
                            speed2Water: this.form.speed2Water,
                        }
                        let message = {
                            type: "env",
                            content: JSON.stringify(env)
                        }
                        this.connection.send(JSON.stringify(message));
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
            },
        },
        created: function () {
            let self = this
            console.log("Starting connection to WebSocket Server")
            self.connection = new WebSocket("ws://localhost:9000/ws")

            self.connection.onmessage = function (event) {
                let data = JSON.parse(event.data)
                console.log(data)
                switch (data.type) {
                    case "envSet": {
                        self.envSet = true
                        break
                    }
                    case "started": {
                        self.calculationStarted = true
                        break
                    }
                    case "data_push": {
                        let content = JSON.parse(data.content)
                        console.log(data)
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

</style>