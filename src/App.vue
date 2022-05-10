<template>
    <div id="app">
        <el-container>
            <el-header style="padding: 0; z-index: 100; text-align: left">
                <div class="header_p">计算温度场</div>
                <el-button @click="formVisible = true" type="success" circle>
                    <i class="el-icon-plus"></i>
                </el-button>
            </el-header>
            <el-container>
                <el-main>
                    <ThreeDField></ThreeDField>
                </el-main>
            </el-container>
        </el-container>

        <el-dialog :visible.sync="formVisible" center top="5vh">
            <el-button type="danger" @click="closeFormDialog" size="normal">关闭</el-button>
            <Form></Form>
        </el-dialog>

        <el-dialog :destroy-on-close="true" :visible.sync="sliceDialogVisible" width="100%" center top="0vh"
                   :fullscreen=true>
            <div class="dialog_title">
                <span>温度场横切片分布详情</span>
                <br>
                <br>
                <el-button @click="closeSliceDialog" type="danger">关闭页面</el-button>
            </div>
            <SliceShow :conn="conn" :config="casterCfg"></SliceShow>
        </el-dialog>

        <el-dialog :destroy-on-close="true" :visible.sync="curvesDialogVisible" width="100%" center top="0vh"
                   :fullscreen=true>
            <div class="dialog_title">
                <el-button @click="closeCurvesDialog" type="danger">关闭页面</el-button>
            </div>
            <Curves :conn="conn" :config="casterCfg"></Curves>
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
                formVisible: true,

                sliceDialogVisible: false,
                curvesDialogVisible: false,

                conn: undefined,
                casterCfg: {}
            }
        },
        methods: {
            closeFormDialog: function () {
                this.formVisible = false
            },
            closeSliceDialog: function () {
                this.$confirm("确认关闭？").then(() => {
                    // if (this.conn !== undefined) {
                    //     this.stopSliceDetail()
                    // }
                    this.sliceDialogVisible = false
                }).catch(() => {
                })
            },
            closeCurvesDialog: function () {
                this.$confirm("确认关闭？").then(() => {
                    if (this.conn !== undefined) {
                        // todo
                    }
                    this.curvesDialogVisible = false
                }).catch(() => {
                })
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
                this.casterCfg = args.config

                this.$root.$emit("open_dialog")
            })

            this.$root.$on("show_detail_curves", (args) => {
                this.curvesDialogVisible = args.show
                this.conn = args.conn
                this.casterCfg = args.config
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
        font-size: larger;
        padding-left: 20px;
        line-height: 60px;
        text-align: left;
        font-weight: bolder;
        letter-spacing: 8px;
        display: inline-block;
    }

    .el-dialog__header {
        display: none;
    }

    .el-dialog__body {
        position: relative;
    }

    .dialog_title {
        text-align: center;
        display: block;
        position: absolute;
        color: #212121;
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
        color: #212121;
        position: absolute;
        z-index: 999;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        cursor: pointer;
    }

    .el-dialog--center .el-dialog__body {
        padding: 10px 25px;
    }

    .dialog_close:hover {
        color: #919191;
    }
</style>