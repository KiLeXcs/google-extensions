// Проверяем, что мы на странице товара (покупка)
if (!window.location.pathname.includes('/goods/')) {
  console.log('BUFF Calculator: скрипт не активен на этой странице');
  (function() { return; })();
}

const processedTDs = new Set();

function calculatePrice(price) {
  const calculated = price * 0.975;
  return Math.floor(calculated * 100) / 100;
}

function analyzeTradeHistory() {
  if (window.location.hash !== '#tab=history') {
    const existingStats = document.querySelector('.buff-trade-stats');
    if (existingStats) {
      existingStats.remove();
    }
    return;
  }
  
  const tbody = document.querySelector('tbody.list_tb_csgo');
  if (!tbody) return;
  
  const rows = Array.from(tbody.querySelectorAll('tr')).filter(function(row) {
    return !row.querySelector('th');
  });
  
  if (rows.length === 0) return;
  
  const prices = [];
  const dates = {};
  const salesData = [];
  
  rows.forEach(function(row) {
    const text = row.textContent;
    const priceMatch = text.match(/¥\s*([\d.]+)/);
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    
    if (priceMatch && dateMatch) {
      const price = parseFloat(priceMatch[1]);
      const date = dateMatch[1];
      if (price > 0 && price < 100000) {
        prices.push(price);
        salesData.push({date: date, price: price});
      }
    }
    
    if (dateMatch) {
      const date = dateMatch[1];
      dates[date] = (dates[date] || 0) + 1;
    }
  });
  
  if (prices.length === 0) return;
  
  const sum = prices.reduce(function(a, b) { return a + b; }, 0);
  const avgPrice = (sum / prices.length).toFixed(2);
  const minPrice = Math.min.apply(null, prices).toFixed(2);
  const maxPrice = Math.max.apply(null, prices).toFixed(2);
  
  const dateEntries = Object.entries(dates).sort(function(a, b) {
    return b[0].localeCompare(a[0]);
  });
  
  let avgInterval = 'N/A';
  let frequencyColor = '#f44336';
  
  if (dateEntries.length > 1) {
    const latest = new Date(dateEntries[0][0]);
    const oldest = new Date(dateEntries[dateEntries.length - 1][0]);
    const daysDiff = Math.max(1, Math.ceil((latest - oldest) / (1000 * 60 * 60 * 24)));
    const salesPerDay = prices.length / daysDiff;
    
    if (salesPerDay >= 10) {
      avgInterval = '>10 sales/day';
      frequencyColor = '#4CAF50';
    } else if (salesPerDay >= 1) {
      avgInterval = salesPerDay.toFixed(1) + ' sales/day';
      if (salesPerDay > 3) {
        frequencyColor = '#4CAF50';
      } else {
        frequencyColor = '#FF9800';
      }
    } else {
      const salesPerWeek = salesPerDay * 7;
      if (salesPerWeek >= 1) {
        avgInterval = salesPerWeek.toFixed(1) + ' sales/week';
        if (salesPerWeek > 5) {
          frequencyColor = '#FFEB3B';
        } else if (salesPerWeek >= 2) {
          frequencyColor = '#FF9800';
        } else {
          frequencyColor = '#f44336';
        }
      } else {
        const salesPerMonth = salesPerDay * 30;
        avgInterval = salesPerMonth.toFixed(1) + ' sales/month';
        frequencyColor = '#f44336';
      }
    }
  } else if (dateEntries.length === 1) {
    avgInterval = prices.length + ' sales on ' + dateEntries[0][0];
    frequencyColor = prices.length >= 3 ? '#4CAF50' : '#FF9800';
  }
  
  showTradeStats(avgPrice, minPrice, maxPrice, avgInterval, frequencyColor, dateEntries.slice(0, 7), salesData);
}

function showTradeStats(avgPrice, minPrice, maxPrice, avgInterval, frequencyColor, recentDates, salesData) {
  if (document.querySelector('.buff-trade-stats')) return;
  
  const statsContainer = document.createElement('div');
  statsContainer.className = 'buff-trade-stats';
  statsContainer.style.cssText = 'position: fixed; left: 0; top: 80px; width: 350px; z-index: 100;';
  
  let recentSales = '';
  for (let i = 0; i < recentDates.length; i++) {
    const dateParts = recentDates[i][0].split('-');
    const formattedDate = dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0];
    recentSales += '<div style="margin-bottom: 6px;"><span style="color: #8b92a8; font-size: 13px;">' + formattedDate + ': </span><strong style="color: #4CAF50; font-size: 13px;">' + recentDates[i][1] + ' sold</strong></div>';
  }
  
  const chartSVG = createPriceChart(salesData, avgPrice);
  
  statsContainer.innerHTML = '<div style="background: linear-gradient(135deg, #1a1f2e 0%, #2d3548 100%); border-radius: 8px; padding: 12px; border: 1px solid #3a455a; box-shadow: 0 4px 12px rgba(0,0,0,0.5); overflow: hidden;">' +
    '<h3 style="margin: 0 0 10px 0; color: #fff; font-size: 14px; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">📊 Sales Statistics</h3>' +
    '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 10px;">' +
    '<div style="background: rgba(33, 150, 243, 0.15); padding: 10px; border-radius: 6px; border-left: 3px solid #2196F3; text-align: center;"><div style="color: #ffffff; font-size: 13px; font-weight: bold;">Max</div><div style="color: #2196F3; font-size: 17px; font-weight: bold; margin-top: 4px;">¥' + maxPrice + '</div></div>' +
    '<div style="background: rgba(255, 152, 0, 0.15); padding: 10px; border-radius: 6px; border-left: 3px solid #FF9800; text-align: center;"><div style="color: #ffffff; font-size: 13px; font-weight: bold;">Min</div><div style="color: #FF9800; font-size: 17px; font-weight: bold; margin-top: 4px;">¥' + minPrice + '</div></div>' +
    '<div style="background: rgba(76, 175, 80, 0.15); padding: 10px; border-radius: 6px; border-left: 3px solid #4CAF50; text-align: center;"><div style="color: #ffffff; font-size: 13px; font-weight: bold;">Avg</div><div style="color: #4CAF50; font-size: 17px; font-weight: bold; margin-top: 4px;">¥' + avgPrice + '</div></div></div>' +
    chartSVG +
    '<div style="background: rgba(0,0,0,0.25); padding: 10px; border-radius: 6px; margin-top: 8px;"><div style="color: #8b92a8; font-size: 13px;"><strong>📈 Frequency:</strong> <span style="color: ' + frequencyColor + '; margin-left: 6px; font-weight: bold; font-size: 14px;">' + avgInterval + '</span></div></div>' +
    '<div style="background: rgba(0,0,0,0.25); padding: 10px; border-radius: 6px; margin-top: 8px;"><div style="color: #8b92a8; font-size: 13px; margin-bottom: 8px;"><strong>📅 Recent Sales:</strong></div>' + recentSales + '</div></div>';
  
  document.body.appendChild(statsContainer);
}

function createPriceChart(salesData, avgPrice) {
  if (salesData.length === 0) return '';
  
  const sortedData = salesData.slice().sort(function(a, b) {
    return a.date.localeCompare(b.date);
  });
  
  const chartData = sortedData.slice(-10);
  
  if (chartData.length < 2) return '';
  
  const prices = chartData.map(function(d) { return d.price; });
  const minPrice = Math.min.apply(null, prices);
  const maxPrice = Math.max.apply(null, prices);
  const priceRange = maxPrice - minPrice || 1;
  
  const width = 315;
  const height = 320;
  const paddingLeft = 35;
  const paddingRight = 35;
  const paddingTop = 20;
  const paddingBottom = 20;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  let points = '';
  chartData.forEach(function(item, i) {
    const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((item.price - minPrice) / priceRange) * chartHeight;
    points += x + ',' + y + ' ';
  });
  
  const avgY = paddingTop + chartHeight - ((avgPrice - minPrice) / priceRange) * chartHeight;
  
return '<div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px; margin-bottom: 8px;">' +
  '<div style="color: #8b92a8; font-size: 11px; margin-bottom: 6px;"><strong>📈 Price Chart:</strong></div>' +
  '<svg width="' + width + '" height="' + height + '" style="background: transparent; border-radius: 4px; display: block;">' +
  '<line x1="' + paddingLeft + '" y1="' + avgY + '" x2="' + (width-paddingRight) + '" y2="' + avgY + '" stroke="#4CAF50" stroke-width="2" stroke-dasharray="5,3"/>' +
  '<polyline points="' + points + '" fill="none" stroke="#2196F3" stroke-width="2"/>' +
  chartData.map(function(item, i) {
    const x = paddingLeft + (i / (chartData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((item.price - minPrice) / priceRange) * chartHeight;
    return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#2196F3"/>';
  }).join('') +
  '<text x="' + (paddingLeft - 5) + '" y="' + (paddingTop + 3) + '" text-anchor="end" font-size="9" fill="#8b92a8">¥' + maxPrice.toFixed(0) + '</text>' +
  '<text x="' + (paddingLeft - 5) + '" y="' + (height - paddingBottom + 5) + '" text-anchor="end" font-size="9" fill="#8b92a8">¥' + minPrice.toFixed(0) + '</text>' +
  '<text x="' + (paddingLeft - 5) + '" y="' + (avgY + 3) + '" text-anchor="end" font-size="9" fill="#4CAF50" font-weight="bold">¥' + parseFloat(avgPrice).toFixed(0) + '</text>' +
  '</svg></div>';
}

function processPrices() {
  const priceCells = document.querySelectorAll('tbody tr td:nth-child(5)');
  priceCells.forEach(function(td) {
    const tdId = td.parentNode.rowIndex + '-' + td.cellIndex;
    if (processedTDs.has(tdId)) return;
    const text = td.textContent.trim();
    const match = text.match(/¥\s*([\d.,]+)/);
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'));
      if (price > 0) {
        const calculated = calculatePrice(price);
        const existing = td.querySelector('.buff-calc-price-final');
        if (existing) {
          processedTDs.add(tdId);
          return;
        }
        const span = document.createElement('span');
        span.className = 'buff-calc-price-final';
        span.textContent = '(¥ ' + calculated.toFixed(2) + ')';
        span.style.cssText = 'color:#2e7d32;font-size:14px;margin-left:0px;white-space:nowrap;font-weight:700;';
        td.appendChild(span);
        processedTDs.add(tdId);
      }
    }
  });
}

setTimeout(function() {
  console.log('🚀 BUFF Calculator started');
  processPrices();
  analyzeTradeHistory();
}, 1000);

let debounceTimer;
const observer = new MutationObserver(function() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function() {
    processPrices();
    analyzeTradeHistory();
  }, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});