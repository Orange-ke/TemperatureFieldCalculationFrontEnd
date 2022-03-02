<template>
    <div id="app">
        <el-container>
            <el-header style="padding: 0; z-index: 100">
                <p class="header_p">计算温度场</p>
            </el-header>
            <el-container>
                <el-aside width="30%">
                    <Form></Form>
                </el-aside>
                <el-main>
                    <ThreeDField></ThreeDField>
                </el-main>
            </el-container>
        </el-container>
        <el-dialog :visible.sync="sliceDialogVisible" width="100%" center top="0vh" :fullscreen=true>
            <span class="dialog_title">温度场切片详情</span>
            <i class="dialog_close el-icon-circle-close" @click="closeSliceDialog"></i>
            <SliceShow :conn="conn" :start="start" :end="end"></SliceShow>
        </el-dialog>

        <el-dialog :visible.sync="curvesDialogVisible" width="100%" center top="0vh" :fullscreen=true>
            <span class="dialog_title">温度场纵切面温度分布详情</span>
            <i class="dialog_close el-icon-circle-close" @click="closeCurvesDialog"></i>
            <Curves :conn="conn"></Curves>
        </el-dialog>
    </div>
</template>

<script>
    import Form from './components/Form'
    import ThreeDField from "./components/ThreeDField";
    import SliceShow from "./components/SliceShow";
    import Curves from "./components/Curves";

    export default {
        components: {
            Curves,
            ThreeDField,
            Form,
            SliceShow,
        },
        name: 'App',
        data() {
            return {
                sliceDialogVisible: false,
                curvesDialogVisible: false,

                conn: undefined,
                start: 0,
                end: 0,
            }
        },
        methods: {
            closeSliceDialog: function () {
                this.$confirm("确认关闭？").then(() => {
                    if (this.conn !== undefined) {
                        this.stopSliceDetail()
                    }
                    this.sliceDialogVisible = false
                }).catch(() => {})
            },
            closeCurvesDialog: function () {
                this.$confirm("确认关闭？").then(() => {
                    if (this.conn !== undefined) {
                        // todo
                    }
                    this.curvesDialogVisible = false
                }).catch(() => {})
            },
            stopSliceDetail: function () {
                let message = {
                    type: "stop_push_slice_detail",
                    content: "stop_push_slice_detail",
                }
                if (this.conn !== undefined) {
                    this.conn.send(JSON.stringify(message));
                    console.log("stop_push_slice_detail")
                }
            }
        },
        mounted() {
            this.$root.$on("show_detail_slice", (args) => {
                this.sliceDialogVisible = args.show
                this.conn = args.conn
                this.start = args.start
                this.end = args.end

                this.$root.$emit("open_dialog")
            })

            this.$root.$on("show_detail_curves", (args) => {
                this.curvesDialogVisible = args.show
                this.conn = args.conn
            })
        }
    }
</script>

<style>
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        width: 100vw;
        height: 100vh;
        box-sizing: border-box;
    }
    /* css reset */
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed,
    figure, figcaption, footer, header, hgroup,
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        vertical-align: baseline;
    }

    /* HTML5 display-role reset for older browsers */
    article, aside, details, figcaption, figure,
    footer, header, hgroup, menu, nav, section {
        display: block;
    }

    body {
        line-height: 1;
    }

    ol, ul {
        list-style: none;
    }

    blockquote, q {
        quotes: none;
    }

    blockquote:before, blockquote:after,
    q:before, q:after {
        content: '';
    }

    table {
        border-collapse: collapse;
        border-spacing: 0;
    }

    .el-container {
        height: 100%;
    }

    .el-header {
        box-sizing: border-box;
        border: 1px solid #ddd;
        box-shadow: rgba(0, 0, 0, 0.35) 0 5px 15px;
        font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
        font-size: large;
    }

    .el-aside {
        height: 100%;
        max-height: 100%;
        border-right: 1px solid #ddd;
        box-sizing: border-box;
        max-width: 30%;
        overflow-x: hidden;
        position: relative;
    }

    .header_p {
        padding-left: 20px;
        line-height: 60px;
        text-align: left;
        font-weight: bolder;
        letter-spacing: 8px;
    }

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        position: relative;
    }

    .dialog_title {
        display: block;
        position: absolute;
        color: white;
        font-size: large;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999;
        font-weight: bolder;

    }

    .dialog_close {
        display: block;
        height: 100px;
        width: 100px;
        text-align: center;
        line-height: 100px;
        font-size: 50px;
        color: white;
        position: absolute;
        z-index: 999;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        cursor: pointer;
    }

    .dialog_close:hover {
        color: #dddddd;
    }
</style>