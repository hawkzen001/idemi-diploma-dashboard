import React from 'react';


const KpiCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="kpi-card glass-panel">
      <div className="kpi-header">
        <h4 className="kpi-title">{title}</h4>
        <div className="kpi-icon-wrapper">
          {Icon && <Icon className="kpi-icon" size={20} />}
        </div>
      </div>
      <div className="kpi-body">
        <span className="kpi-value">{value}</span>
        {trend && (
          <span className={`kpi-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
