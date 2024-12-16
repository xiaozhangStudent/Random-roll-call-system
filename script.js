// 存储所有学生名单
let students = [];
// 存储已被点到的学生
let selectedStudents = [];
// 存储学生备注
let studentNotes = {};
// 存储学生勾选状态
let studentChecks = {};
// 添加新的状态存储
let studentCorrect = {};
let studentWrong = {};

// 导入学生名单
function importStudents() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // 按行分割文本，过滤空行
            students = e.target.result.split('\n')
                .map(name => name.trim())
                .filter(name => name);
            
            // 更新界面和数据
            updateStatistics();
            updateStudentSuggestions();
            
            // 显示导入成功提示
            const result = document.getElementById('result');
            result.textContent = `成功导入 ${students.length} 名学生`;
            result.style.color = '#4CAF50';
            
            // 2秒后清空显示，而不是显示"等待点名..."
            setTimeout(() => {
                result.textContent = ' ';  // 使用空格而不是空字符串，保持高度
                result.style.color = '#2c3e50';
            }, 2000);
        };
        reader.readAsText(file);
    }
    
    // 清空文件输入框，允许重复选择同一文件
    fileInput.value = '';
}

// 添加一个辅助函数用于获取随机学生
function getRandomStudent(excludeStudent = null) {
    const availableStudents = students.filter(
        student => !selectedStudents.includes(student) && student !== excludeStudent
    );
    if (availableStudents.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableStudents.length);
    return availableStudents[randomIndex];
}

// 修改随机选择学生函数
function randomSelect() {
    const resultDiv = document.getElementById('result');
    
    if (students.length === 0) {
        resultDiv.textContent = '请先导入学生名单';
        resultDiv.style.color = '#f44336';
        return;
    }
    
    // 过滤掉已被选中的学生
    const availableStudents = students.filter(
        student => !selectedStudents.includes(student)
    );
    
    if (availableStudents.length === 0) {
        resultDiv.textContent = '所有学生都已被点到，请重置';
        resultDiv.style.color = '#f44336';
        setTimeout(() => {
            resultDiv.style.color = '#2c3e50';
        }, 3000);
        return;
    }
    
    // 随机选择最终的学生
    const finalStudent = getRandomStudent();
    
    // 禁用随机点名按钮，防止动画过程中重复点击
    const randomButton = document.querySelector('button[onclick="randomSelect()"]');
    randomButton.disabled = true;
    
    // 预生成一些随机学生名字
    const randomPool = new Set();
    // 确保第一个显示的名字不是"等待点名"
    randomPool.add(getRandomStudent(finalStudent));
    
    for (let i = 0; i < 19; i++) {
        const student = getRandomStudent(finalStudent);
        if (student) randomPool.add(student);
    }
    const randomStudents = Array.from(randomPool);
    
    // 开始动画前立即显示第一个随机名字
    let currentStudent = randomStudents[0];
    resultDiv.textContent = currentStudent;
    
    // 开始动画
    let duration = 3000;
    let startTime = null;
    let lastUpdateTime = 0;
    
    function easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }
    
    function easeOutQuart(x) {
        return 1 - Math.pow(1 - x, 4);
    }
    
    function getUpdateInterval(progress) {
        // 调整更新间隔范围
        const minInterval = 40;  // 稍微减小最小间隔
        const maxInterval = 600; // 减小最大间隔
        
        // 使用更平滑的缓动函数
        const easeProgress = easeOutQuart(progress);
        
        // 使用非线性插值来计算间隔
        const interval = minInterval + (maxInterval - minInterval) * easeProgress;
        
        // 在最后阶段使用更平滑的过渡
        if (progress > 0.8) {
            return interval * (1 + (progress - 0.8) * 2);
        }
        
        return interval;
    }
    
    function getNextStudent() {
        // 从预生成的池中随机选择，提高性能
        return randomStudents[Math.floor(Math.random() * randomStudents.length)];
    }
    
    function animate(currentTime) {
        if (!startTime) {
            startTime = currentTime;
            lastUpdateTime = currentTime;
        }
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const updateInterval = getUpdateInterval(progress);
        
        if (currentTime - lastUpdateTime >= updateInterval) {
            const tempStudent = getNextStudent();
            if (tempStudent && tempStudent !== currentStudent) {
                currentStudent = tempStudent;
                resultDiv.textContent = currentStudent;
                lastUpdateTime = currentTime;
            }
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 确保最终显示正确的学生，并防止闪烁
            resultDiv.textContent = finalStudent;
            resultDiv.style.color = '#2c3e50';
            selectedStudents.push(finalStudent);
            updateSelectedList();
            updateStatistics();
            randomButton.disabled = false;
        }
    }
    
    requestAnimationFrame(animate);
}

// 更新已选学生列表显示
function updateSelectedList() {
    const selectedList = document.getElementById('selectedList');
    if (selectedStudents.length === 0) {
        selectedList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无点名记录</div>';
        return;
    }
    
    // 创建一个倒序的数组
    const reversedStudents = [...selectedStudents].reverse();
    
    selectedList.innerHTML = reversedStudents.map((student, index) => {
        // 计算原始索引（用于保持正确的编号和数据关联）
        const originalIndex = selectedStudents.length - 1 - index;
        return `
            <div class="student-item" style="animation: fadeIn 0.5s ease-out ${index * 0.1}s">
                <span class="student-number">${originalIndex + 1}</span>
                <span class="student-name">${student}</span>
                <div class="status-group">
                    <label class="checkbox-wrapper checkbox-wrapper-correct">
                        <input type="checkbox" class="student-checkbox" id="correct_${originalIndex}" 
                            title="回答正确"
                            onchange="saveCorrect(${originalIndex})" ${studentCorrect[student] ? 'checked' : ''}>
                        <span class="checkbox-custom correct"></span>
                        <span class="checkbox-label">正确</span>
                    </label>
                    <label class="checkbox-wrapper checkbox-wrapper-wrong">
                        <input type="checkbox" class="student-checkbox" id="wrong_${originalIndex}" 
                            title="回答错误"
                            onchange="saveWrong(${originalIndex})" ${studentWrong[student] ? 'checked' : ''}>
                        <span class="checkbox-custom wrong"></span>
                        <span class="checkbox-label">错误</span>
                    </label>
                </div>
                <input type="text" class="student-note" id="note_${originalIndex}" 
                    placeholder="点击添加备注..." onchange="saveNote(${originalIndex})"
                    value="${studentNotes[student] || ''}">
            </div>
        `;
    }).join('');
}

// 保存勾选状态
function saveCheck(index) {
    const checkBox = document.getElementById(`check_${index}`);
    const student = selectedStudents[index];
    studentChecks[student] = checkBox.checked;
}

// 保存备注
function saveNote(index) {
    const noteInput = document.getElementById(`note_${index}`);
    const student = selectedStudents[index];
    studentNotes[student] = noteInput.value;
}

// 保存正确状态
function saveCorrect(index) {
    const checkBox = document.getElementById(`correct_${index}`);
    const student = selectedStudents[index];
    studentCorrect[student] = checkBox.checked;
    if (checkBox.checked) {
        // 如果勾选正确，取消错误勾选
        document.getElementById(`wrong_${index}`).checked = false;
        studentWrong[student] = false;
    }
    updateStatistics();
}

// 保存错误状态
function saveWrong(index) {
    const checkBox = document.getElementById(`wrong_${index}`);
    const student = selectedStudents[index];
    studentWrong[student] = checkBox.checked;
    if (checkBox.checked) {
        // 如果勾选错误，取��正确勾选
        document.getElementById(`correct_${index}`).checked = false;
        studentCorrect[student] = false;
    }
    updateStatistics();
}

// 添加导出Excel功能
function exportToExcel() {
    if (selectedStudents.length === 0) {
        alert('还没有点名记录！');
        return;
    }

    // 创建CSV内容
    let csvContent = '序号,姓名,回答状况,备注\n';
    selectedStudents.forEach((student, index) => {
        let status = '未回答';
        if (studentCorrect[student]) status = '回答正确';
        if (studentWrong[student]) status = '回答错误';
        const note = studentNotes[student] || '';
        csvContent += `${index + 1},${student},${status},${note}\n`;
    });

    // 处理中文编码
    const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `点名记录-${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 重置系统
function reset() {
    const resultDiv = document.getElementById('result');
    selectedStudents = [];
    studentNotes = {};
    studentCorrect = {};
    studentWrong = {};
    
    // 如果已导入学生名单，显示空格，否则显示"请先导入学生名单"
    if (students.length > 0) {
        resultDiv.textContent = ' ';  // 使用空格而不是空字符串，保持高度
    } else {
        resultDiv.textContent = '请先导入学生名单';
    }
    resultDiv.style.color = '#2c3e50';
    
    document.getElementById('manualInput').value = '';
    updateSelectedList();
    updateStatistics();
    updateStudentSuggestions();
}

// 添加更新统计信息的函数
function updateStatistics() {
    // 计算已点名学生的状态
    const total = selectedStudents.length;
    const correct = selectedStudents.filter(student => studentCorrect[student]).length;
    const wrong = selectedStudents.filter(student => studentWrong[student]).length;
    const noAnswerSelected = total - correct - wrong;  // 已点名但未回答的人数
    
    // 计算总学生数和未被点到的学生数
    const totalStudents = students.length;  // 总学生数
    const notSelected = totalStudents - total;  // 未被点到的学生数
    
    // 更新数量显示
    document.getElementById('totalCount').textContent = totalStudents;
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('wrongCount').textContent = wrong;
    document.getElementById('noAnswerCount').textContent = noAnswerSelected;
    document.getElementById('notSelectedCount').textContent = notSelected;
    
    // 更新百分比（于总学生数计算）
    document.getElementById('correctPercent').textContent = 
        totalStudents ? Math.round(correct / totalStudents * 100) + '%' : '0%';
    document.getElementById('wrongPercent').textContent = 
        totalStudents ? Math.round(wrong / totalStudents * 100) + '%' : '0%';
    document.getElementById('noAnswerPercent').textContent = 
        totalStudents ? Math.round(noAnswerSelected / totalStudents * 100) + '%' : '0%';
    document.getElementById('notSelectedPercent').textContent = 
        totalStudents ? Math.round(notSelected / totalStudents * 100) + '%' : '0%';
}

// 更新学生列表建议
function updateStudentSuggestions() {
    const datalist = document.getElementById('studentList');
    datalist.innerHTML = students
        .filter(student => !selectedStudents.includes(student))
        .map(student => `<option value="${student}">`)
        .join('');
}

// 手动点名函数
function manualSelect() {
    const input = document.getElementById('manualInput');
    const studentName = input.value.trim();
    const resultDiv = document.getElementById('result');
    
    if (!studentName) {
        resultDiv.textContent = '请输入学生姓名';
        resultDiv.style.color = '#f44336';
        return;
    }
    
    // 检查是否在学生名单中
    if (!students.includes(studentName)) {
        resultDiv.textContent = '该学生不在名单中';
        resultDiv.style.color = '#f44336';
        return;
    }
    
    // 检查是否已被点到
    if (selectedStudents.includes(studentName)) {
        resultDiv.textContent = '该学生已被点到';
        resultDiv.style.color = '#f44336';
        return;
    }
    
    // 更新显示
    resultDiv.textContent = studentName;
    resultDiv.style.color = '#2c3e50';
    selectedStudents.push(studentName);
    updateSelectedList();
    updateStatistics();
    
    // 清空输入框并更新建议列表
    input.value = '';
    updateStudentSuggestions();
}

// 修改按钮样式，添加禁用状态
function addButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
    `;
    document.head.appendChild(style);
}

// 页面加载时添加按钮样式
document.addEventListener('DOMContentLoaded', addButtonStyles); 

// 修改下载功能
function downloadOfflineVersion() {
    // 创建一个临时容器来复制内容
    const tempContainer = document.querySelector('.container').cloneNode(true);
    
    // 移除版权声明和下载按钮
    const copyright = tempContainer.querySelector('.copyright');
    const downloadBtn = tempContainer.querySelector('.download-btn');
    if (copyright) copyright.remove();
    if (downloadBtn) downloadBtn.remove();
    
    // 获取当前页面的完整 HTML 内容
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>随机点名系统</title>
    <style>
        ${Array.from(document.styleSheets[0].cssRules)
            .filter(rule => !rule.selectorText || 
                          (!rule.selectorText.includes('.copyright') && 
                           !rule.selectorText.includes('.download-btn')))
            .map(rule => rule.cssText)
            .join('\n')}
    </style>
</head>
<body>
    ${tempContainer.outerHTML}
    <script>
        ${document.querySelector('script').textContent.replace(/function downloadOfflineVersion\(\)[\s\S]*?}/, '')}
    </script>
</body>
</html>`;

    // 创建 Blob 对象
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    
    // 创建并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = `随机点名系统-${date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
} 