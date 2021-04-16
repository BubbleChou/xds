<template>
    <div>
        <div class="topContainer">
            <el-date-picker v-model="query.createTime" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 300px; margin-right: 30px"></el-date-picker>
            <el-button type="primary" @click="getList" style="margin-right: 20px">查询</el-button>
            <el-button type="primary" @click="openNewDialog">新增</el-button>
        </div>
        <div class="container">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <p style="font-size: 20px">进货管理</p>
                </el-breadcrumb-item>
            </el-breadcrumb>
            <br/>
            <el-table :data="tableData" border class="table" ref="multipleTable" header-cell-class-name="table-header">
                <el-table-column type="index" label="序号" width="100"></el-table-column>
                <el-table-column prop="createTime" label="日期">
                    <template slot-scope="scope">
                        {{scope.row.createTime | simpleDateFormat}}
                    </template>
                </el-table-column>
                <el-table-column prop="stockNum" label="进货类型数量"></el-table-column>
                <el-table-column prop="stockTotal" label="进货总价"></el-table-column>
                <el-table-column prop="status" label="状态">
                    <template slot-scope="scope">
                        <el-tag :type="scope.row.status === '0' ? 'primary' : 'success'" disable-transitions>{{scope.row.status | statusFilter}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" align="center">
                    <template slot-scope="scope">
                        <el-button type="text" icon="el-icon-lx-attention" @click="handleSee(scope.row)">查看</el-button>
                        <el-button type="text" icon="el-icon-lx-edit" @click="reEdit(scope.row)" v-if="scope.row.status === '1'">重新编辑</el-button>
                        <el-button type="text" icon="el-icon-lx-down" @click="exportExcel(scope.row)" v-if="scope.row.status === '1'">导出</el-button>
                    </template>
                </el-table-column>

            </el-table>
            <div class="pagination">
                <el-pagination
                        background
                        layout="total, sizes, prev, pager, next"
                        :current-page="query.page"
                        :page-size="query.pageSize"
                        :total="pageTotal"
                        @current-change="handlePageChange"
                        @size-change="handleSizeChange"
                ></el-pagination>
            </div>
        </div>

        <!-- 编辑弹出框 -->
        <el-dialog v-dialogDrag title="编辑进货" :visible.sync="dialogVisible" :before-close="closeDialog" :close-on-click-modal="false" center width="90%">
            <el-table :data="detailData" border show-summary :summary-method="getSummaries" max-height="500px" class="tb-edit"  ref="detailTable" highlight-current-row>
                <el-table-column type="index" label="序号" width="100"></el-table-column>
                <el-table-column prop="currentLabel" label="品名">
                    <template slot-scope="scope">
                        <el-select v-if="saveVisible" filterable :filter-method="firstWordFilter" v-model="scope.row.currentLabel"  placeholder="请选择" @change="handleSelect($event, scope.row)">
                            <el-option v-for="item in codeList" :key="item.id" :label="item.label" :value="item"></el-option>
                        </el-select>
                        <span>{{scope.row.currentLabel}}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="currentWeight" label="菜品重量/kg"></el-table-column>
                <el-table-column prop="num" label="数量">
                    <template slot-scope="scope">
                        <el-input v-if="saveVisible" size="small" v-model="scope.row.num" placeholder="输入数量" type="number" min="0" @change="numChange($event, scope.row)"></el-input> <span>{{scope.row.num}}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="weight" label="单价重量/kg">
                    <template slot-scope="scope">
                        <el-input v-if="saveVisible" size="small" v-model="scope.row.weight" placeholder="输入重量" type="number" min="0" @change="weightChange($event, scope.row)"></el-input> <span>{{scope.row.weight}}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="totalWeight" label="总重量/kg"></el-table-column>
                <el-table-column prop="pieceNum" label="份数"></el-table-column>
                <el-table-column prop="currentValue" label="单价"></el-table-column>
                <el-table-column prop="total" label="总价"></el-table-column>
                <el-table-column width="80" align="center" v-if="saveVisible">
                    <template slot="header" slot-scope="scope">
                        <el-button type="primary"  @click="addNewDetail">新增</el-button>
                    </template>
                    <template slot-scope="scope">
                        <el-button
                                type="text"
                                icon="el-icon-delete"
                                class="red"
                                @click="handleDelete(scope.$index, scope.row)"
                        >删除</el-button>
                    </template>
                </el-table-column>

            </el-table>
            <span slot="footer" class="dialog-footer">
                <el-button v-if="saveVisible" type="primary" @click="saveDetail('0')">保 存</el-button>
                <el-button @click="closeDialog">取 消</el-button>
                <el-button v-if="commitVisible" type="primary" @click="saveDetail('1')">提 交</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>


    import { isEmpty } from '../../main';
    import axios from 'axios';

    export default {
        name: 'stockmanagement',
        data() {
            return {
                query: {
                    createTime:'',
                    page: 1,
                    pageSize: 10
                },
                flag:'0',
                currentCode:'',
                tableData: [],
                detailData: [],
                codeList: [],
                copy: {},
                saveVisible: false,
                commitVisible: false,
                dialogVisible: false,
                pageTotal: 0,
                idx: -1,
                id: -1
            };
        },
        created() {
            console.log(1)
            this.getList();
            this.postRequest('ingredients/getCodeList', {type:'stock'}).then(response => {
                if (response.data.success) {
                    this.codeList = response.data.data.list;
                    this.copy = Object.assign(this.codeList)
                }
            });
        },
        mounted () {
            window.vue = this;
        },
        filters: {
            statusFilter(value){
                if (value === '0') {
                    return '编辑中'
                }
                if (value === '1') {
                    return '已提交'
                }
            }
        },
        methods: {
            getSummaries(param) {
                //param 是固定的对象，里面包含 columns与 data参数的对象 {columns: Array[4], data: Array[5]},包含了表格的所有的列与数据信息
                const { columns, data } = param;
                const sums = [];
                columns.forEach((column, index) => {
                    if (index === 0) {
                        sums[index] = '总数';
                        return;
                    }
                    if (index === 1 || index === 2  || index === 4 || index === 6 || index === 7) {
                        sums[index] = '';
                        return;
                    }
                    const values = data.map(item => Number(item[column.property]));
                    //验证每个value值是否是数字，如果是执行if
                    if (!values.every(value => isNaN(value))) {
                        sums[index] = values.reduce((prev, curr) => {
                            return prev + curr;
                        }, 0);
                    } else {
                        sums[index] = '';
                    }
                });
                return sums;
            },
            firstWordFilter(value){
                this.codeList = this.copy.filter((item) => {
                    // 如果直接包含输入值直接返回true
                    const val = value.toLowerCase()
                    if (item.sortLabel.indexOf(val) !== -1){
                        return true
                    }
                })
            },
            getList() {
                this.postRequest('ingredients/getStock', this.query).then(response => {
                    if (response.data.success) {
                        this.tableData = response.data.data.list;
                        this.pageTotal = response.data.data.total;
                    }
                });
            },
            openNewDialog() {
                this.detailData = [];
                this.dialogVisible = true;
                this.saveVisible = true;
            },
            // 触发搜索按钮
            handleSearch() {
                this.$set(this.query, 'pageIndex', 1);
                this.getList();
            },
            // 删除操作
            handleDelete(index, row) {
                this.$confirm('确定要删除吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.$notify.success('删除成功');
                    this.detailData.splice(index, 1);
                }).catch(() => {});
            },
            // 编辑操作
            handleSee(row) {
                this.dialogVisible = true;
                if (row.status === '0') {
                    this.saveVisible = true;
                    this.commitVisible = true;
                }
                this.postRequest('ingredients/getDetail', { id: row.id }).then(response => {
                    if (response.data.success) {
                        this.detailData = response.data.data;
                    }
                });
            },
            reEdit(row){
                this.$confirm('确定要重新编辑吗？', '提示', {
                    type: 'warning'
                }).then(() => {
                    this.postRequest('ingredients/reEditDetail', { id: row.id }).then(response => {
                        if (response.data.success) {
                            this.$notify.success('更改状态成功！');
                            this.getList();
                        }
                    });
                }).catch(() => {});
            },
            exportExcel(row){
                axios.post('http://localhost:8080/ingredients/exportExcel',{id : row.id}, { responseType:'blob' }).then((res)=>{
                    const content = res.data
                    const blob = new Blob([content])//构造一个blob对象来处理数据
                    var date = new Date(row.createTime);
                    const fileName = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '.xls';
                    //对于<a>标签，只有 Firefox 和 Chrome（内核） 支持 download 属性
                    //IE10以上支持blob但是依然不支持download
                    if ('download' in document.createElement('a')) { //支持a标签download的浏览器
                        const link = document.createElement('a')//创建a标签
                        link.download = fileName//a标签添加属性
                        link.style.display = 'none'
                        link.href = URL.createObjectURL(blob)
                        document.body.appendChild(link)
                        link.click()//执行下载
                        URL.revokeObjectURL(link.href) //释放url
                        document.body.removeChild(link)//释放标签
                    } else { //其他浏览器
                        navigator.msSaveBlob(blob, fileName)
                    }
                }).catch((err)=>{
                    console.log(err);
                })
            },
            // 保存
            saveDetail(commitFlag) {
                let flag = false;
                this.detailData.forEach((item, index) =>{
                    if (isEmpty(item.currentLabel) || isEmpty(item.num) || isEmpty(item.weight)) {
                        flag = true
                    }
                })
                if (flag) {
                    this.$message.info('请录入完整的数据！');
                    return
                }
                let param = {
                    flag: commitFlag,
                    detailList: this.detailData
                }
                if (commitFlag === '1') {
                    this.$confirm('提交后无法编辑,确认提交?', '提示', {
                        type: 'warning'
                    }).then(() => {
                        this.postRequest('ingredients/saveDetail', param).then(response => {
                            if (response.data.success) {
                                if (response.data.success) {
                                    this.$notify.success('提交成功！');
                                }
                                this.dialogVisible = false;
                                this.saveVisible = false;
                                this.commitVisible = false;
                                this.getList();
                            } else {
                                this.$notify.error(response.data.msg);
                            }
                        });
                    }).catch(() => {});
                } else {
                    this.postRequest('ingredients/saveDetail', param).then(response => {
                        if (response.data.success) {
                            this.$notify.success('保存成功！');
                            this.dialogVisible = false;
                            this.saveVisible = false;
                            this.commitVisible = false;
                            this.getList();
                        } else {
                            this.$notify.error(response.data.msg);
                        }
                    });
                }
            },
            // 分页导航
            handlePageChange(val) {
                this.$set(this.query, 'page', val);
                this.getList();
            },
            handleSizeChange(val) {
                this.$set(this.query, 'pageSize', val);
                this.getList();
            },
            addNewDetail(){
                this.detailData.push({
                    currentLabel:'',
                    currentValue: null,
                    currentWeight:'',
                    num: 0,
                    weight: 0,
                    totalWeight:0,
                    pieceNum:'',
                    total: 0,
                    code:{}
                })
            },
            closeDialog(){
                if (!this.saveVisible && !this.commitVisible) {
                    this.dialogVisible = false;
                    this.saveVisible = false;
                    this.commitVisible = false;
                    return
                }
                if (this.detailData.length > 0) {
                    this.$confirm('未保存的数据,确认关闭?', '提示', {
                        type: 'warning'
                    }).then(() => {
                        this.dialogVisible = false;
                        this.saveVisible = false;
                        this.commitVisible = false;
                    }).catch(() => {});
                } else {
                    this.dialogVisible = false;
                    this.saveVisible = false;
                    this.commitVisible = false;
                }
            },
            handleSelect(value, row){
                row.currentLabel = value.label;
                row.currentValue = value.value;
                row.currentWeight = value.weight;
                if (row.num !== undefined) {
                    row.total = row.currentValue * row.num;
                }
                this.codeList = this.copy;
            },
            numChange(value, row){
                row.total = row.currentValue * value;
                row.totalWeight = row.weight * value;
                row.pieceNum = row.totalWeight / row.currentWeight
            },
            weightChange(value, row){
                row.totalWeight = row.num * value;
                row.pieceNum = row.totalWeight / row.currentWeight
            }
        }
    };
</script>

<style scoped>
    .handle-box {
        margin-bottom: 20px;
    }

    .handle-select {
        width: 120px;
    }

    .handle-input {
        width: 300px;
        display: inline-block;
    }

    .table {
        width: 100%;
        font-size: 14px;
    }

    .mr10 {
        margin-right: 10px;
    }

    .table-td-thumb {
        display: block;
        margin: auto;
        width: 40px;
        height: 40px;
    }
    .tb-edit .el-input {
        display: none
    }
    .tb-edit .current-row .el-input  {
        display: block
    }
    .tb-edit .current-row .el-input+span {
        display: none
    }
    .tb-edit  .el-select {
        display: none
    }
    .tb-edit .current-row .el-select {
        display: block
    }
    .tb-edit .current-row .el-select+span {
        display: none
    }
</style>
