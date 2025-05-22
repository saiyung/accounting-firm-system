/**
 * 数据协调装饰器 - 用于处理数据库模型与API响应之间的字段差异
 * 
 * 功能：
 * 1. 自动记录字段差异
 * 2. 支持自定义字段映射
 * 3. 包含类型转换处理器
 * 4. 输出Diff报告
 * 
 * @param {Object} options - 配置选项
 * @param {Object} options.fieldMapping - 字段映射表
 * @param {Object} options.typeConverters - 类型转换器
 * @param {Boolean} options.debug - 是否启用调试模式
 * @returns {Function} - 装饰器函数
 */
export function dataReconciliation(options = {}) {
  const {
    fieldMapping = {},
    typeConverters = {},
    debug = false
  } = options;

  // 反向映射表 - 用于从目标字段找到源字段
  const reverseMapping = {};
  Object.entries(fieldMapping).forEach(([source, target]) => {
    reverseMapping[target] = source;
  });

  // 记录日志
  const logDiff = (message, data) => {
    if (debug) {
      console.log(`[DataReconciliation] ${message}`, data);
    }
  };

  // 生成Markdown差异表格
  const generateDiffTable = (diffs) => {
    if (diffs.length === 0) return null;

    let markdown = `
| 字段 | 源值 | 目标值 | 类型 | 解决方案 |
|------|------|--------|------|----------|
`;

    diffs.forEach(diff => {
      const solution = diff.solution || '需要手动处理';
      markdown += `| ${diff.field} | \`${diff.sourceValue}\` | \`${diff.targetValue}\` | ${diff.type} | ${solution} |\n`;
    });

    return markdown;
  };

  // 返回装饰器函数
  return function(target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args) {
      const sourceData = args[0] || {};
      const targetData = args[1] || {};
      const differences = [];

      logDiff('开始协调数据', { sourceData, targetData });

      // 1. 检查源数据中的字段是否存在于目标数据中
      Object.keys(sourceData).forEach(sourceKey => {
        const sourceValue = sourceData[sourceKey];
        
        // 确定目标数据中对应的字段名
        const targetKey = fieldMapping[sourceKey] || sourceKey;
        
        // 检查目标数据中是否存在该字段
        if (!(targetKey in targetData)) {
          differences.push({
            field: sourceKey,
            sourceValue,
            targetValue: undefined,
            type: '字段缺失',
            solution: `在目标中添加 ${targetKey} 字段`
          });
          return;
        }

        const targetValue = targetData[targetKey];

        // 类型不匹配检查
        if (typeof sourceValue !== typeof targetValue) {
          const solution = typeConverters[sourceKey] 
            ? `使用 ${sourceKey} 类型转换器` 
            : '需要类型转换';
            
          differences.push({
            field: sourceKey,
            sourceValue,
            targetValue,
            type: '类型不匹配',
            solution
          });
        }
        
        // 值不匹配检查
        else if (JSON.stringify(sourceValue) !== JSON.stringify(targetValue)) {
          differences.push({
            field: sourceKey,
            sourceValue,
            targetValue,
            type: '值不匹配',
            solution: '合并或更新'
          });
        }
      });

      // 2. 检查目标数据中有但源数据中没有的字段
      Object.keys(targetData).forEach(targetKey => {
        const sourceKey = reverseMapping[targetKey] || targetKey;
        
        if (!(sourceKey in sourceData)) {
          differences.push({
            field: targetKey,
            sourceValue: undefined,
            targetValue: targetData[targetKey],
            type: '额外字段',
            solution: `从目标中复制到源`
          });
        }
      });

      logDiff('发现差异', differences);

      // 3. 执行类型转换
      const convertedData = { ...sourceData };
      
      differences.forEach(diff => {
        const { field, type } = diff;
        
        if (type === '类型不匹配' && typeConverters[field]) {
          try {
            // 应用类型转换
            convertedData[field] = typeConverters[field](sourceData[field]);
            diff.solution = '已自动转换';
            diff.resolved = true;
          } catch (error) {
            diff.solution = `转换失败: ${error.message}`;
            diff.resolved = false;
          }
        }
      });

      // 4. 执行字段映射
      const mappedData = { ...convertedData };
      
      Object.entries(fieldMapping).forEach(([sourceKey, targetKey]) => {
        if (sourceKey in mappedData) {
          mappedData[targetKey] = mappedData[sourceKey];
          
          // 只在字段名不同时删除原字段
          if (sourceKey !== targetKey) {
            delete mappedData[sourceKey];
          }
        }
      });

      // 5. 生成差异报告
      const diffReport = {
        differences,
        markdownTable: generateDiffTable(differences),
        hasUnresolvedDiffs: differences.some(d => !d.resolved),
        sourceData,
        targetData,
        convertedData: mappedData
      };

      // 调用原始方法，并传入处理后的数据和差异报告
      return originalMethod.call(this, mappedData, targetData, diffReport);
    };

    return descriptor;
  };
}

/**
 * 用户信息协调函数示例
 * 使用数据协调装饰器处理用户信息不匹配问题
 * 
 * @param {Object} dbUser - 数据库用户对象
 * @param {Object} apiUser - API返回的用户对象
 * @returns {Object} - 协调后的用户对象
 */
export class UserDataService {
  @dataReconciliation({
    fieldMapping: {
      userName: "username",
      registeredAt: "signup_date",
      departmentId: "department_id",
      userRole: "role",
      phoneNumber: "phone"
    },
    typeConverters: {
      signup_date: value => value instanceof Date ? value.toISOString() : value,
      department_id: value => value.toString(),
      active: value => Boolean(value)
    },
    debug: true
  })
  reconcileUsers(dbUser, apiUser, diffReport) {
    console.log('用户数据差异报告:', diffReport.markdownTable);
    
    // 合并数据
    const mergedUser = {
      ...diffReport.convertedData,
      // 应用自定义合并规则
      lastUpdated: new Date().toISOString()
    };
    
    // 记录合并结果
    if (diffReport.hasUnresolvedDiffs) {
      console.warn('存在未解决的数据差异:', 
        diffReport.differences.filter(d => !d.resolved));
    }
    
    return mergedUser;
  }
} 