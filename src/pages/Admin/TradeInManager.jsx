import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Check, Save, Package, ArrowUp, ArrowDown
} from 'lucide-react';
import { listenToTradeInDevices, saveTradeInDevice, deleteTradeInDevice, updateAllDeviceOrders } from '../../utils/tradeInService';
import toast from 'react-hot-toast';

export default function TradeInManager() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  
  const [formData, setFormData] = useState({
    deviceType: 'phone',
    brand: '',
    name: '',
    priceBrandNew: '',
    priceExcellent: '',
    priceVeryGood: '',
    priceGood: '',
    priceFair: ''
  });

  useEffect(() => {
    const unsub = listenToTradeInDevices((data) => {
      setDevices(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const uniqueDeviceTypes = Array.from(new Set(devices.map(d => d.deviceType || 'phone').filter(Boolean)));
  const uniqueSubCategories = Array.from(new Set(devices.map(d => d.brand).filter(Boolean)));
  const uniqueModels = Array.from(
    new Set(
      devices
        .filter(d => !formData.brand || d.brand.toLowerCase() === formData.brand.toLowerCase())
        .map(d => d.name)
        .filter(Boolean)
    )
  );

  const handleMoveUp = async (index) => {
    if (index === 0 || searchTerm) return;
    const newDevices = [...devices];
    const temp = newDevices[index];
    newDevices[index] = newDevices[index - 1];
    newDevices[index - 1] = temp;
    setDevices(newDevices);
    try {
      await updateAllDeviceOrders(newDevices);
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === devices.length - 1 || searchTerm) return;
    const newDevices = [...devices];
    const temp = newDevices[index];
    newDevices[index] = newDevices[index + 1];
    newDevices[index + 1] = temp;
    setDevices(newDevices);
    try {
      await updateAllDeviceOrders(newDevices);
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const handleOpenModal = (device = null) => {
    if (device) {
      setEditingDevice(device);
      setFormData({
        deviceType: device.deviceType || 'phone',
        brand: device.brand,
        name: device.name,
        priceBrandNew: device.priceBrandNew || '',
        priceExcellent: device.priceExcellent || '',
        priceVeryGood: device.priceVeryGood || '',
        priceGood: device.priceGood || '',
        priceFair: device.priceFair || ''
      });
    } else {
      setEditingDevice(null);
      setFormData({ deviceType: 'phone', brand: '', name: '', priceBrandNew: '', priceExcellent: '', priceVeryGood: '', priceGood: '', priceFair: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({ deviceType: 'phone', brand: '', name: '', priceBrandNew: '', priceExcellent: '', priceVeryGood: '', priceGood: '', priceFair: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.name.trim()) {
      toast.error('Sub Category and Model are required');
      return;
    }

    try {
      await saveTradeInDevice({
        id: editingDevice?.id,
        brand: formData.brand,
        name: formData.name,
        deviceType: formData.deviceType,
        priceBrandNew: formData.priceBrandNew,
        priceExcellent: formData.priceExcellent,
        priceVeryGood: formData.priceVeryGood,
        priceGood: formData.priceGood,
        priceFair: formData.priceFair
      });
      toast.success(editingDevice ? 'Device updated successfully' : 'Device added successfully');
      handleCloseModal();
    } catch (err) {
      toast.error('Failed to save device');
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteTradeInDevice(id);
        toast.success('Device deleted successfully');
      } catch (err) {
        toast.error('Failed to delete device');
        console.error(err);
      }
    }
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-white">Loading trade-in catalog...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#E8E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trade-in Catalog</h1>
          <p style={{ color: '#9898A8', fontSize: '0.85rem', marginTop: 4 }}>Manage devices eligible for trade-in and their base quotation values.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ 
            background: 'linear-gradient(135deg,#D42B2B,#A01E1E)', color: '#fff', border: 'none', 
            padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, display: 'flex', 
            alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' 
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div style={{ background: '#161618', borderRadius: 16, border: '1px solid #2A2A30', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2A2A30', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#707080' }} />
            <input 
              type="text" 
              placeholder="Search by sub-category or model..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', 
                borderRadius: 8, padding: '0.5rem 1rem 0.5rem 2.5rem', color: '#fff', fontSize: '0.85rem' 
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#1E1E22', fontSize: '0.75rem', color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Sub Category</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Model</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Type</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 800 }}>Price Range (Fair - Brand New)</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 800, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#707080' }}>
                  <Package size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  No devices found in the trade-in catalog.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => {
                const isFirstInGroup = index === 0 || device.brand !== filteredDevices[index - 1].brand || (device.deviceType || 'phone') !== (filteredDevices[index - 1].deviceType || 'phone');
                const isLastInGroup = index === filteredDevices.length - 1 || device.brand !== filteredDevices[index + 1].brand || (device.deviceType || 'phone') !== (filteredDevices[index + 1].deviceType || 'phone');
                
                return (
                  <tr key={device.id} style={{ borderTop: '1px solid #2A2A30', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1E1E22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#E8E8F0' }}>{device.brand}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#C8C8D4' }}>{device.name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#9898A8', textTransform: 'capitalize' }}>{device.deviceType || 'phone'}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#10b981', fontWeight: 700 }}>
                      ₦{Number(device.priceFair || 0).toLocaleString()} - ₦{Number(device.priceBrandNew || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      {!searchTerm && (
                        <>
                          <button 
                            onClick={() => handleMoveUp(index)}
                            disabled={isFirstInGroup}
                            style={{ background: 'rgba(255,255,255,0.05)', color: isFirstInGroup ? '#555' : '#E8E8F0', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: 6, marginRight: 8, cursor: isFirstInGroup ? 'not-allowed' : 'pointer' }}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            onClick={() => handleMoveDown(index)}
                            disabled={isLastInGroup}
                            style={{ background: 'rgba(255,255,255,0.05)', color: isLastInGroup ? '#555' : '#E8E8F0', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem', borderRadius: 6, marginRight: 8, cursor: isLastInGroup ? 'not-allowed' : 'pointer' }}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </>
                      )}
                    <button 
                      onClick={() => handleOpenModal(device)}
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '0.4rem', borderRadius: 6, marginRight: 8, cursor: 'pointer' }}
                    >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(device.id, device.name)}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '0.4rem', borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#161618', border: '1px solid #2A2A30', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2A2A30', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E8E8F0' }}>
                {editingDevice ? 'Edit Trade-in Device' : 'Add Trade-in Device'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#707080', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Device Type</label>
                  <input 
                    type="text"
                    list="deviceTypeList"
                    value={formData.deviceType}
                    onChange={e => setFormData({...formData, deviceType: e.target.value.toLowerCase()})}
                    style={{ width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.75rem', color: '#fff' }}
                    required
                  />
                  <datalist id="deviceTypeList">
                    {uniqueDeviceTypes.map((dt, i) => <option key={i} value={dt} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Sub Category (e.g. iPhone, Galaxy S)</label>
                  <input 
                    type="text" 
                    list="subCategoryList"
                    value={formData.brand} 
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    style={{ width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.75rem', color: '#fff' }}
                    required
                  />
                  <datalist id="subCategoryList">
                    {uniqueSubCategories.map((sub, i) => <option key={i} value={sub} />)}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Device Model (e.g. iPhone 13 Pro Max)</label>
                  <input 
                    type="text" 
                    list="modelList"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{ width: '100%', background: '#1E1E22', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.75rem', color: '#fff' }}
                    required
                  />
                  <datalist id="modelList">
                    {uniqueModels.map((m, i) => <option key={i} value={m} />)}
                  </datalist>
                </div>

                <div style={{ background: '#1E1E22', padding: '1.25rem', borderRadius: 12, border: '1px solid #2A2A30' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9898A8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Condition Pricing (₦)</label>
                    <button 
                      type="button"
                      onClick={() => {
                        const base = Number(formData.priceBrandNew) || 0;
                        setFormData({
                          ...formData,
                          priceExcellent: Math.round(base * 0.9),
                          priceVeryGood: Math.round(base * 0.8),
                          priceGood: Math.round(base * 0.65),
                          priceFair: Math.round(base * 0.45)
                        });
                        toast.success('Auto-calculated prices from Brand New');
                      }}
                      style={{ background: 'rgba(212, 43, 43, 0.1)', color: '#D42B2B', border: '1px solid rgba(212, 43, 43, 0.2)', padding: '0.25rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Auto-Calculate
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#C8C8D4', marginBottom: 4 }}>Brand New</label>
                      <input type="number" value={formData.priceBrandNew} onChange={e => setFormData({...formData, priceBrandNew: e.target.value})} style={{ width: '100%', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.5rem', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#C8C8D4', marginBottom: 4 }}>Excellent</label>
                      <input type="number" value={formData.priceExcellent} onChange={e => setFormData({...formData, priceExcellent: e.target.value})} style={{ width: '100%', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.5rem', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#C8C8D4', marginBottom: 4 }}>Very Good</label>
                      <input type="number" value={formData.priceVeryGood} onChange={e => setFormData({...formData, priceVeryGood: e.target.value})} style={{ width: '100%', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.5rem', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#C8C8D4', marginBottom: 4 }}>Good</label>
                      <input type="number" value={formData.priceGood} onChange={e => setFormData({...formData, priceGood: e.target.value})} style={{ width: '100%', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.5rem', color: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#C8C8D4', marginBottom: 4 }}>Fair</label>
                      <input type="number" value={formData.priceFair} onChange={e => setFormData({...formData, priceFair: e.target.value})} style={{ width: '100%', background: '#161618', border: '1px solid #2A2A30', borderRadius: 8, padding: '0.5rem', color: '#fff' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 8, border: '1px solid #2A2A30', background: 'transparent', color: '#E8E8F0', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ background: '#D42B2B', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <Save size={16} /> Save Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
