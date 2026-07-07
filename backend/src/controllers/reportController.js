const { Op } = require('sequelize');
const Order = require('../models/Order');
const ExcelJS = require('exceljs');
const jsPDF = require('jspdf');
const logger = require('../utils/logger');

const generateReport = async (req, res) => {
  try {
    const {
      startDate, endDate, location, department, mealCategory, format = 'json',
    } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.order_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (location) where.location = location;
    if (department) where.department = department;
    if (mealCategory) where.meal_category = mealCategory;

    const orders = await Order.findAll({
      where,
      order: [['order_date', 'DESC']],
    });

    if (format === 'excel') {
      return generateExcelReport(res, orders);
    }

    if (format === 'pdf') {
      return generatePDFReport(res, orders);
    }

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
    });
  }
};

const generateExcelReport = async (res, orders) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders Report');

    // Add headers
    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 20 },
      { header: 'Staff Name', key: 'staff_name', width: 20 },
      { header: 'Staff ID', key: 'staff_id', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Location', key: 'location', width: 12 },
      { header: 'Meal Category', key: 'meal_category', width: 12 },
      { header: 'Rice Type', key: 'rice_type', width: 15 },
      { header: 'Swallow Type', key: 'swallow_type', width: 15 },
      { header: 'Soup', key: 'soup', width: 12 },
      { header: 'Protein', key: 'protein', width: 20 },
      { header: 'Order Date', key: 'order_date', width: 12 },
      { header: 'Order Time', key: 'order_time', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Add data rows
    orders.forEach((order) => {
      worksheet.addRow({
        id: order.id,
        staff_name: order.staff_name,
        staff_id: order.staff_id,
        department: order.department,
        location: order.location,
        meal_category: order.meal_category,
        rice_type: order.rice_type || '',
        swallow_type: order.swallow_type || '',
        soup: order.soup || '',
        protein: order.protein,
        order_date: new Date(order.order_date).toLocaleDateString(),
        order_time: order.order_time,
        status: order.status,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e40af' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Generate Excel report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel report',
    });
  }
};

const generatePDFReport = async (res, orders) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Title
    doc.setFontSize(16);
    doc.text('Meal Orders Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Report info
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, yPosition);
    doc.text(`Total Orders: ${orders.length}`, 10, yPosition + 5);
    yPosition += 15;

    // Table
    const headers = ['Staff', 'Department', 'Location', 'Meal', 'Status'];
    const data = orders.map((order) => [
      `${order.staff_name} (${order.staff_id})`,
      order.department,
      order.location,
      `${order.rice_type || order.swallow_type}`,
      order.status,
    ]);

    doc.autoTable({
      head: [headers],
      body: data,
      startY: yPosition,
      margin: 10,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-report.pdf');

    res.send(doc.output('arraybuffer'));
  } catch (error) {
    logger.error('Generate PDF report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report',
    });
  }
};

module.exports = {
  generateReport,
};
