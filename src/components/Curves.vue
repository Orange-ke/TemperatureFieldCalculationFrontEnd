<template>
    <div id="curves_container">
        <el-row class="col_container">
            <el-col class="col_item" :span="12">
                <div class="grid-content bg-purple">
                    <div id="chartLine" class="line-wrap"></div>
                </div>
            </el-col>
            <el-col class="col_item" :span="12">
                <div class="grid-content bg-purple-light">

                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
    import * as echarts from 'echarts';
    require('echarts/theme/shine');//引入主题

    export default {
        data() {
            return {
                chartLine: null
            }
        },
        mounted() {
            this.$nextTick(() => {
                this.drawLineChart();
            })
        },
        methods: {
            drawLineChart() {
                this.chartLine = echarts.init(this.$el,'shine');// 基于准备好的dom，初始化echarts实例
                let option = {
                    tooltip : {
                        trigger: 'axis'
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category',
                            boundaryGap : false,
                            axisTick: {
                                show: false
                            },
                            data : ['100','200','300','400','500','600','700'],
                            name: '(到结晶器顶部距离)'
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value',
                            axisTick: {
                                show: false
                            },
                            name: '（温度）'
                        }
                    ],
                    series : [
                        {
                            name:'切片1',
                            type:'line',
                            stack: '总量',
                            data:[1550, 1320, 1100, 934, 880, 840, 830]
                        },
                    ]
                };
                // 使用刚指定的配置项和数据显示图表
                this.chartLine.setOption(option);
            }
        }
    }
</script>

<style scoped>
    #curves_container {
        width: 100%;
        height: calc(100vh - 60px);
        border: 1px solid #ddd;
        position: relative;
        background-color: #212121;
    }

    .col_container {
        padding-top: 120px;
        height: 100%;
        box-sizing: border-box;
    }

    .col_item {
        padding: 15px;
        height: 100%;
    }

    .line-wrap{
        width:50%;
        height:400px;
    }
</style>