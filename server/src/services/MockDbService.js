/**
 * 模拟数据库服务
 * 使用JSON文件进行CRUD操作，模拟MongoDB数据库
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { DATA_DIR } = require('../utils/generateMockDb');

class MockDbService {
  constructor(collection) {
    this.collection = collection;
    this.dataFilePath = path.join(DATA_DIR, `${collection}.json`);
    
    // 确保数据文件存在
    if (!fs.existsSync(this.dataFilePath)) {
      fs.writeFileSync(this.dataFilePath, JSON.stringify([], null, 2));
      logger.info(`创建空数据文件: ${this.dataFilePath}`);
    }
  }

  /**
   * 获取所有数据
   * @param {Object} filter - 过滤条件
   * @returns {Array} - 符合条件的数据数组
   */
  async findAll(filter = {}) {
    try {
      const data = this._readData();
      
      // 如果没有过滤条件，返回所有数据
      if (!filter || Object.keys(filter).length === 0) {
        return data;
      }
      
      // 应用过滤条件
      return data.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    } catch (error) {
      logger.error(`查询${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据ID查找数据
   * @param {String} id - 数据ID
   * @returns {Object|null} - 找到的数据或null
   */
  async findById(id) {
    try {
      const data = this._readData();
      return data.find(item => item.id === id) || null;
    } catch (error) {
      logger.error(`根据ID查询${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 根据条件查找数据
   * @param {Object} filter - 过滤条件
   * @returns {Object|null} - 找到的第一条数据或null
   */
  async findOne(filter) {
    try {
      const data = this._readData();
      return data.find(item => {
        return Object.entries(filter).every(([key, value]) => item[key] === value);
      }) || null;
    } catch (error) {
      logger.error(`查询单个${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 创建数据
   * @param {Object} data - 要创建的数据
   * @returns {Object} - 创建的数据
   */
  async create(data) {
    try {
      const allData = this._readData();
      
      // 生成ID（如果没有提供）
      const newItem = {
        ...data,
        id: data.id || `${this.collection.charAt(0).toUpperCase()}${uuidv4().substring(0, 6)}`,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      allData.push(newItem);
      this._writeData(allData);
      
      logger.info(`创建${this.collection}成功: ${newItem.id}`);
      return newItem;
    } catch (error) {
      logger.error(`创建${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新数据
   * @param {String} id - 要更新的数据ID
   * @param {Object} updateData - 更新的数据
   * @returns {Object|null} - 更新后的数据或null
   */
  async update(id, updateData) {
    try {
      const allData = this._readData();
      const index = allData.findIndex(item => item.id === id);
      
      if (index === -1) {
        return null;
      }
      
      // 更新数据并添加更新时间
      const updatedItem = {
        ...allData[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      allData[index] = updatedItem;
      this._writeData(allData);
      
      logger.info(`更新${this.collection}成功: ${id}`);
      return updatedItem;
    } catch (error) {
      logger.error(`更新${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除数据
   * @param {String} id - 要删除的数据ID
   * @returns {Boolean} - 删除是否成功
   */
  async delete(id) {
    try {
      const allData = this._readData();
      const initialLength = allData.length;
      
      const filteredData = allData.filter(item => item.id !== id);
      
      if (filteredData.length === initialLength) {
        return false; // 没有数据被删除
      }
      
      this._writeData(filteredData);
      
      logger.info(`删除${this.collection}成功: ${id}`);
      return true;
    } catch (error) {
      logger.error(`删除${this.collection}失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 读取数据文件
   * @private
   * @returns {Array} - 数据数组
   */
  _readData() {
    try {
      const content = fs.readFileSync(this.dataFilePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`读取${this.collection}数据文件失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 写入数据文件
   * @private
   * @param {Array} data - 要写入的数据数组
   */
  _writeData(data) {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error(`写入${this.collection}数据文件失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = MockDbService; 