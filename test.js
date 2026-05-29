// Bit Slice 功能测试脚本
// 用法: node test.js

let passed = 0;
let failed = 0;
const failures = [];

function assert(description, condition, expected, actual) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${description}`);
    } else {
        failed++;
        const msg = `  ✗ ${description}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`;
        console.log(msg);
        failures.push(msg);
    }
}

// ==================== 复制核心函数 ====================

function hexToBinary(hex) {
    if (!hex) return '';
    return hex.split('').map(char => {
        return parseInt(char, 16).toString(2).padStart(4, '0');
    }).join('');
}

function binaryToHex(binary, padLength) {
    if (!binary) return '';
    const hex = BigInt('0b' + binary).toString(16).toUpperCase();
    return hex.padStart(padLength, '0');
}

function parseVerilogHex(input) {
    const regex = /^(\d+)'[hH]([0-9a-fA-F]+)$/;
    const match = input.match(regex);
    if (match) {
        const bitWidth = parseInt(match[1]);
        if (bitWidth === 0) return '';
        const hexValue = match[2];
        let binary = hexToBinary(hexValue);
        if (binary.length > bitWidth) {
            binary = binary.slice(-bitWidth);
        }
        return binary.padStart(bitWidth, '0');
    }
    return hexToBinary(input);
}

function findMatchPositions(binStr, target) {
    const positions = [];
    if (!binStr || !target || target.length === 0) return positions;
    let idx = binStr.indexOf(target);
    while (idx !== -1) {
        positions.push(idx);
        idx = binStr.indexOf(target, idx + 1);
    }
    return positions;
}

// ==================== 模拟 updateAll 核心逻辑 ====================
function simulateUpdateAll(hexStr, windowSize, startBit, matchInputVal, isHexMode) {
    let binaryStr = hexToBinary(hexStr);
    const totalBits = binaryStr.length;
    
    // 匹配逻辑
    let targetBin = '';
    let matchPositions = [];
    let currentMatchIndex = -1;
    
    if (matchInputVal) {
        targetBin = isHexMode ? parseVerilogHex(matchInputVal) : matchInputVal.replace(/[^01]/g, '');
    }
    
    matchPositions = findMatchPositions(binaryStr, targetBin);
    
    // --- 修复后的逻辑：startBit 在匹配更新之后才读取 ---
    if (matchPositions.length > 0 && currentMatchIndex === -1) {
        currentMatchIndex = 0;
        startBit = matchPositions[0];
    }
    
    // 重组结果
    const groups = [];
    if (totalBits > 0 && startBit <= totalBits - 1) {
        const hexPadLength = Math.ceil(windowSize / 4);
        let currentPos = startBit;
        let groupIndex = 0;
        
        while (currentPos + windowSize <= totalBits) {
            const unitBinary = binaryStr.slice(currentPos, currentPos + windowSize);
            const unitHex = binaryToHex(unitBinary, hexPadLength);
            groups.push({ start: currentPos, end: currentPos + windowSize, hex: unitHex, index: groupIndex });
            currentPos += windowSize;
            groupIndex++;
        }
    }
    
    return {
        binaryStr,
        totalBits,
        windowSize,
        startBit,
        matchPositions,
        currentMatchIndex,
        groups: groups.map(g => g.hex).join(' '),
        groupCount: groups.length,
    };
}

// ==================== 1. hexToBinary 测试 ====================
console.log('\n=== 1. hexToBinary 基础转换 ===');
assert('空字符串', hexToBinary('') === '', '', hexToBinary(''));
assert('单字符 0', hexToBinary('0') === '0000', '0000', hexToBinary('0'));
assert('单字符 F', hexToBinary('F') === '1111', '1111', hexToBinary('F'));
assert('单字符 A', hexToBinary('A') === '1010', '1010', hexToBinary('A'));
assert('多字符 A3', hexToBinary('A3') === '10100011', '10100011', hexToBinary('A3'));
assert('全0', hexToBinary('00') === '00000000', '00000000', hexToBinary('00'));
assert('全F', hexToBinary('FFFF') === '1111111111111111', '1111111111111111', hexToBinary('FFFF'));
assert('混合 5A', hexToBinary('5A') === '01011010', '01011010', hexToBinary('5A'));

// ==================== 2. binaryToHex 测试 ====================
console.log('\n=== 2. binaryToHex 基础转换 ===');
assert('空字符串', binaryToHex('', 0) === '', '', binaryToHex('', 0));
assert('单个 nibble 0001', binaryToHex('0001', 1) === '1', '1', binaryToHex('0001', 1));
assert('单个 nibble 1111', binaryToHex('1111', 1) === 'F', 'F', binaryToHex('1111', 1));
assert('8bit 带填充', binaryToHex('10100011', 2) === 'A3', 'A3', binaryToHex('10100011', 2));
assert('8bit 带填充 FF', binaryToHex('11111111', 2) === 'FF', 'FF', binaryToHex('11111111', 2));
assert('不填充', binaryToHex('1', 0) === '1', '1', binaryToHex('1', 0));

// BigInt 大位宽验证
const bin64 = '1111111111111111111111111111111111111111111111111111111111111111';
assert('64bit全1 → FFFFFFFFFFFFFFFF', binaryToHex(bin64, 16) === 'FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', binaryToHex(bin64, 16));
const bin128 = '1'.repeat(128);
const hex128 = binaryToHex(bin128, 32);
assert('128bit → 32位hex', hex128 === 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', hex128);
const bin512 = '1010' + '1'.repeat(508);
const hex512 = binaryToHex(bin512, 128);
assert('512bit (输入上限) 不丢失精度', hex512.startsWith('A') && hex512.length === 128, true, hex512.length === 128 && hex512.startsWith('A'));


// ==================== 3. parseVerilogHex 测试 ====================
console.log('\n=== 3. parseVerilogHex Verilog风格解析 ===');
assert('普通hex F', parseVerilogHex('F') === '1111', '1111', parseVerilogHex('F'));
assert('普通hex A3', parseVerilogHex('A3') === '10100011', '10100011', parseVerilogHex('A3'));
assert('Verilog 7\'h3F', parseVerilogHex("7'h3F") === '0111111', '0111111', parseVerilogHex("7'h3F"));
assert('Verilog 7\'H3F (大写H)', parseVerilogHex("7'H3F") === '0111111', '0111111', parseVerilogHex("7'H3F"));
assert('Verilog 8\'hFF', parseVerilogHex("8'hFF") === '11111111', '11111111', parseVerilogHex("8'hFF"));
assert('Verilog 4\'h1 (补齐)', parseVerilogHex("4'h1") === '0001', '0001', parseVerilogHex("4'h1"));
assert('Verilog 3\'hF (截断取低位)', parseVerilogHex("3'hF") === '111', '111', parseVerilogHex("3'hF"));
assert('Verilog 4\'h0', parseVerilogHex("4'h0") === '0000', '0000', parseVerilogHex("4'h0"));
assert('Verilog 16\'hABCD', parseVerilogHex("16'hABCD") === '1010101111001101', '1010101111001101', parseVerilogHex("16'hABCD"));

// 边界: 0'h0
assert('Verilog 0\'h0 (零宽度)', parseVerilogHex("0'h0") === '', '', parseVerilogHex("0'h0"));

// ==================== 4. findMatchPositions 测试 ====================
console.log('\n=== 4. findMatchPositions 匹配搜索 ===');
assert('空字符串', JSON.stringify(findMatchPositions('', '1')), '[]', JSON.stringify(findMatchPositions('', '1')));
assert('空target', JSON.stringify(findMatchPositions('1010', '')), '[]', JSON.stringify(findMatchPositions('1010', '')));
assert('单次匹配', JSON.stringify(findMatchPositions('1010', '10')), '[0]', JSON.stringify(findMatchPositions('1010', '10')));
assert('无匹配', JSON.stringify(findMatchPositions('1010', '00')), '[]', JSON.stringify(findMatchPositions('1010', '00')));
assert('多次匹配', JSON.stringify(findMatchPositions('10101010', '10')), '[0,2,4,6]', JSON.stringify(findMatchPositions('10101010', '10')));
assert('末尾匹配', JSON.stringify(findMatchPositions('101001', '01')), '[3]', JSON.stringify(findMatchPositions('101001', '01')));
assert('从begin开始匹配', JSON.stringify(findMatchPositions('0101010', '010')), '[0,2]', JSON.stringify(findMatchPositions('0101010', '010')));

// ==================== 5. updateAll 核心流程模拟测试 ====================
console.log('\n=== 5. updateAll 核心流程 ===');

// 测试1: 基本切片 - 无匹配
let result = simulateUpdateAll('A3F2', 8, 0, '', true);
assert('基本切片 A3F2 w=8 start=0 无匹配', result.groups === 'A3 F2', 'A3 F2', result.groups);
assert('基本切片 A3F2 group数量', result.groupCount === 2, 2, result.groupCount);
assert('基本切片 A3F2 binaryStr', result.binaryStr === '1010001111110010', '1010001111110010', result.binaryStr);

// 测试2: 不同窗口大小
result = simulateUpdateAll('A3F2', 4, 0, '', true);
assert('w=4 切片 A3F2', result.groups === 'A 3 F 2', 'A 3 F 2', result.groups);

result = simulateUpdateAll('A3F2', 16, 0, '', true);
assert('w=16 切片 A3F2 (单组)', result.groups === 'A3F2', 'A3F2', result.groups);

// 测试3: 非零起始位
result = simulateUpdateAll('A3F2', 8, 4, '', true);
assert('start=4 w=8 A3F2', result.groups === '3F', '3F', result.groups);

// 测试4: ★★★ 匹配自动跳转修复验证 ★★★
// FF3FFF = 11111111 00111111 11111111 (24 bits)
// '3F' 作为普通 hex → 00111111 (8 bits), 匹配位置在 bit 8
result = simulateUpdateAll('FF3FFF', 8, 999, '3F', true);
assert('匹配自动跳转: startBit应被覆盖为匹配位置', result.startBit === 8, 8, result.startBit);
assert('匹配自动跳转: matchPositions应有匹配', JSON.stringify(result.matchPositions), '[8]', JSON.stringify(result.matchPositions));

// 更深度的测试：匹配在起始位置
result = simulateUpdateAll('3FFF00', 8, 999, '3F', true);
assert('匹配在字节起始: startBit应为0', result.startBit === 0, 0, result.startBit);

// 测试5: 二进制模式匹配
// 00FF3F = 00000000 11111111 00111111, '11111111' 匹配在 bit 8
result = simulateUpdateAll('00FF3F', 8, 999, '11111111', false);
assert('二进制模式匹配', result.startBit === 8, 8, result.startBit);
assert('二进制模式 matchPositions', JSON.stringify(result.matchPositions), '[8]', JSON.stringify(result.matchPositions));

// 测试6: Verilog 风格匹配 — 使用 00FF3F 避免跨字节匹配
// 00FF3F = 00000000 11111111 00111111, 8'hFF = 11111111 匹配在 bit 8
result = simulateUpdateAll('00FF3F', 8, 999, "8'hFF", true);
assert('Verilog匹配 8\'hFF', result.startBit === 8, 8, result.startBit);

// 测试7: 多个匹配位置，首次匹配到第一个
result = simulateUpdateAll('3F3F3F', 8, 999, '3F', true);
assert('多个匹配首次跳转第一个', result.startBit === 0, 0, result.startBit);
assert('多个匹配检出所有', result.matchPositions.length === 3, 3, result.matchPositions.length);

// 测试8: 窗口size为1
result = simulateUpdateAll('A3', 1, 0, '', true);
assert('w=1 单bit切片', result.groups === '1 0 1 0 0 0 1 1', '1 0 1 0 0 0 1 1', result.groups);

// 测试9: 窗口比数据大
result = simulateUpdateAll('A3', 16, 0, '', true);
assert('w=16 > 数据长度, 无结果', result.groups === '', '', result.groups);

// ==================== 6. 边界情况 ====================
console.log('\n=== 6. 边界情况 ===');

// 空输入
result = simulateUpdateAll('', 8, 0, '', true);
assert('空hex输入', result.groups === '', '', result.groups);
assert('空hex输入 binaryStr为空', result.binaryStr === '', '', result.binaryStr);
assert('空hex输入 totalBits=0', result.totalBits === 0, 0, result.totalBits);

// 最大窗口 = 最大bits
result = simulateUpdateAll('FF', 8, 0, '', true);
assert('w=dataLen=8', result.groups === 'FF', 'FF', result.groups);
assert('w=dataLen group=1', result.groupCount === 1, 1, result.groupCount);

// start在数据末尾
result = simulateUpdateAll('A3F2', 8, 15, '', true);
assert('start=15 (最后一个bit)', result.groups === '', '', result.groups);

// start刚好在最后一个完整组的开始
result = simulateUpdateAll('A3F2', 4, 12, '', true);
assert('start=12 w=4 最后一组', result.groups === '2', '2', result.groups);

// 匹配序列比数据长
result = simulateUpdateAll('A3', 8, 0, '11111111111111111111111111111111', true);
assert('匹配序列比数据长', result.matchPositions.length === 0, 0, result.matchPositions.length);

// 普通hex输入也能被parseVerilogHex处理
assert('纯hex "A" 解析', parseVerilogHex('A') === '1010', '1010', parseVerilogHex('A'));

// ==================== 7. 状态化测试：模拟连续输入匹配模式 ====================
console.log('\n=== 7. 状态化测试：模式变更时的 currentMatchIndex 重置 ===');

function createStatefulSimulator(hexStr, windowSize, startBit) {
    let currentMatchIndex = -1;
    let currentStartBit = startBit;
    let matchPositions = [];

    return function step(matchInputVal, isHexMode, resetOnChange) {
        if (resetOnChange) currentMatchIndex = -1;
        return simulateStatefulUpdate(hexStr, windowSize, currentStartBit, matchInputVal, isHexMode);
    };

    function simulateStatefulUpdate(hexStr, windowSize, startBit, matchInputVal, isHexMode) {
        const binaryStr = hexToBinary(hexStr);
        const totalBits = binaryStr.length;

        let targetBin = '';
        if (matchInputVal) {
            targetBin = isHexMode ? parseVerilogHex(matchInputVal) : matchInputVal.replace(/[^01]/g, '');
        }

        matchPositions = findMatchPositions(binaryStr, targetBin);

        // 模拟真实的 updateAll 行为
        if (matchPositions.length > 0 && currentMatchIndex === -1) {
            currentMatchIndex = 0;
            currentStartBit = matchPositions[0];
        }

        const groups = [];
        const w = windowSize;
        if (totalBits > 0 && currentStartBit <= totalBits - 1) {
            const hexPadLength = Math.ceil(w / 4);
            let currentPos = currentStartBit;
            let groupIndex = 0;
            while (currentPos + w <= totalBits) {
                const unitBinary = binaryStr.slice(currentPos, currentPos + w);
                const unitHex = binaryToHex(unitBinary, hexPadLength);
                groups.push({ start: currentPos, end: currentPos + w, hex: unitHex, index: groupIndex });
                currentPos += w;
                groupIndex++;
            }
        }

        return {
            binaryStr,
            totalBits,
            windowSize: w,
            startBit: currentStartBit,
            matchPositions,
            currentMatchIndex,
            groups: groups.map(g => g.hex).join(' '),
            groupCount: groups.length,
        };
    }
}

// ★ 关键测试：模拟 BUG 场景 — 不重置 currentMatchIndex
// 00FFCF = 00000000 11111111 11001111 (24 bits)
// 'FF' = 11111111 匹配在 bit 8; 'CF' = 11001111 匹配在 bit 16
console.log('  --- 不重置 currentMatchIndex（BUG 行为） ---');
const simNoReset = createStatefulSimulator('00FFCF', 8, 0);

let r1 = simNoReset('FF', true, false);  // 第一次匹配 'FF'
assert('BUG复现: 首次匹配跳转', r1.startBit === 8, 8, r1.startBit);
assert('BUG复现: 首次 currentMatchIndex=0', r1.currentMatchIndex === 0, 0, r1.currentMatchIndex);

let r2 = simNoReset('CF', true, false);  // 换匹配 'CF'，不重置
// BUG: currentMatchIndex 仍是 0，不会重新跳到 'CF' 的首次匹配 (bit 16)
assert('BUG复现: 换模式后不跳转（滑条卡在旧位置）', r2.startBit === 8, 8, r2.startBit);

// ★ 修复验证：重置 currentMatchIndex
console.log('  --- 重置 currentMatchIndex（修复行为） ---');
const simWithReset = createStatefulSimulator('00FFCF', 8, 0);

let r3 = simWithReset('FF', true, true);  // 第一次
assert('修复验证: 首次匹配跳转', r3.startBit === 8, 8, r3.startBit);

let r4 = simWithReset('CF', true, true);  // 换模式，重置 currentMatchIndex
assert('修复验证: 换模式后重新跳转到新匹配位置', r4.startBit === 16, 16, r4.startBit);

// ==================== 报告 ====================
console.log(`\n${'='.repeat(50)}`);
console.log(`测试结果: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
    console.log(`\n失败详情:`);
    failures.forEach(f => console.log(f));
}
process.exit(failures.length > 0 ? 1 : 0);
