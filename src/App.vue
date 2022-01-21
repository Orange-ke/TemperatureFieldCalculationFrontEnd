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
                    <ThreeDTest></ThreeDTest>
                </el-main>
            </el-container>
        </el-container>
        <el-dialog title="显示详细切片温度信息图" :visible.sync="centerDialogVisible" width="100%" center top="0vh" :fullscreen=true>

        </el-dialog>
    </div>
</template>

<script>
    import Form from './components/Form'
    import ThreeDTest from "./components/ThreeDTest";

    export default {
        components: {
            ThreeDTest,
            Form,
        },
        name: 'App',
        data() {
            return {
                centerDialogVisible: false,
            }
        },
        mounted() {
            this.$root.$on("show_detail_slice", (show) => {
                this.centerDialogVisible = show
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

    /**
   * Eric Meyer's Reset CSS v2.0 (http://meyerweb.com/eric/tools/css/reset/)
   * http://cssreset.com
   */
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
</style>