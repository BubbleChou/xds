<template>
    <div>
        <div class="topContainer">
            <el-input v-model="query.type" placeholder="类型" style="width: 300px; margin-right: 20px"></el-input>
            <el-input v-model="query.label" placeholder="标签" style="width: 300px; margin-right: 30px"></el-input>
            <el-button type="primary" @click="getList" style="margin-right: 20px">查询</el-button>
            <el-button type="primary" @click="openNewDialog">新增码表</el-button>
        </div>
        <div class="container">
<!--            <div class="handle-box">-->
<!--                <el-button-->
<!--                        type="primary"-->
<!--                        icon="el-icon-delete"-->
<!--                        class="handle-del mr10"-->
<!--                        @click="delAllSelection"-->
<!--                >批量删除-->
<!--                </el-button>-->
<!--                <el-select v-model="query.address" placeholder="地址" class="handle-select mr10">-->
<!--                    <el-option key="1" label="广东省" value="广东省"></el-option>-->
<!--                    <el-option key="2" label="湖南省" value="湖南省"></el-option>-->
<!--                </el-select>-->
<!--                <el-input v-model="query.name" placeholder="用户名" class="handle-input mr10"></el-input>-->
<!--                <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>-->
<!--            </div>-->
            <el-breadcrumb separator="/">
                <el-breadcrumb-item>
                    <p style="font-size: 20px">系统码表</p>
                </el-breadcrumb-item>
            </el-breadcrumb>
            <br/>
            <el-table
                    :data="tableData"
                    border
                    class="table"
                    ref="multipleTable"
                    header-cell-class-name="table-header"
            >
                <el-table-column type="index" label="序号" width="100"></el-table-column>
                <el-table-column prop="type" label="类型"></el-table-column>
                <el-table-column prop="label" label="标签"></el-table-column>
                <el-table-column prop="value" label="值"></el-table-column>
                <el-table-column label="操作" width="180" align="center">
                    <template slot-scope="scope">
                        <el-button
                                type="text"
                                icon="el-icon-edit"
                                @click="handleEdit(scope.$index, scope.row)"
                        >编辑</el-button>
                        <el-button
                                type="text"
                                icon="el-icon-delete"
                                class="red"
                                @click="handleDelete(scope.$index, scope.row)"
                        >删除</el-button>
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
        <el-dialog title="编辑码表" v-dialogDrag :visible.sync="dialogVisible" :close-on-click-modal="false" width="30%">
            <el-form ref="form" :model="form" label-width="70px">
                <el-form-item label="类型">
                    <el-input v-model="form.type" :disabled="editable"></el-input>
                </el-form-item>
                <el-form-item label="标签">
                    <el-input v-model="form.label"></el-input>
                </el-form-item>
                <el-form-item label="值">
                    <el-input v-model="form.value"></el-input>
                </el-form-item>
                <el-form-item label="重量/kg">
                    <el-input v-model="form.weight"></el-input>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="saveSysCode">确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>


    import { isEmpty } from '../../main';

    export default {
        name: 'basetable',
        data() {
            return {
                query: {
                    type:'',
                    label:'',
                    page: 1,
                    pageSize: 10
                },
                tableData: [],
                multipleSelection: [],
                delList: [],
                editable:false,
                dialogVisible: false,
                pageTotal: 0,
                form: {
                    id:'',
                    type:'',
                    label:'',
                    value:'',
                    weight:''
                },
                idx: -1,
                id: -1
            };
        },
        created() {
            this.getList();
        },
        methods: {
            getList() {
                this.postRequest('ingredients/getCodeList',this.query).then(response=>{
                    if (response.data.success) {
                        this.tableData = response.data.data.list;
                        this.pageTotal = response.data.data.total;
                    }
                })
            },
            openNewDialog(){
                this.form = {
                    id:'',
                    type:'',
                    label:'',
                    value:'',
                }
                this.editable = false;
                this.dialogVisible = true;
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
                    this.postRequest('ingredients/deleteCode', row).then(response=>{
                        if (response.data.success) {
                            this.$notify.success('删除成功！');
                            this.getList();
                        } else {
                            this.$notify.error(response.data.msg);
                        }
                    })
                }).catch(() => {});
            },
            // 编辑操作
            handleEdit(index, row) {
                Object.assign(this.form, row);
                this.dialogVisible = true;
                this.editable = true;
            },
            // 保存
            saveSysCode() {
                if (isEmpty(this.form.label) || isEmpty(this.form.value) || isEmpty(this.form.type) || isEmpty(this.form.weight)) {
                    this.$message.warning('请录入完整数据');
                    return
                }
                this.postRequest('ingredients/saveCode',this.form).then(response=>{
                    if (response.data.success) {
                        if (!this.editable) {
                            this.$notify.success('新增成功！');
                        }else{
                            if (response.data.success) {
                                this.$notify.success('修改成功！');
                            }
                        }
                        this.dialogVisible = false;
                        this.getList();
                    } else {
                        this.$notify.error(response.data.msg);
                    }
                })
            },
            // 分页导航
            handlePageChange(val) {
                this.$set(this.query, 'page', val);
                this.getList();
            },
            handleSizeChange(val) {
                this.$set(this.query, 'pageSize', val);
                this.getList();
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

    .red {
        color: #ff0000;
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
</style>
