import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';

function TeamTab({ teamMembers, saveTeamMembers, orders, filaments, externalParts, showNotification }) {
  const [editingMember, setEditingMember] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) {
      showNotification('Please enter a name', 'error');
      return;
    }

    const newMember = {
      id: `member${Date.now()}`,
      name: newMemberName.trim()
    };

    saveTeamMembers([...teamMembers, newMember]);
    setNewMemberName('');
    showNotification('Team member added');
  };

  const updateMemberName = (id, name) => {
    const updated = teamMembers.map(m => m.id === id ? { ...m, name } : m);
    saveTeamMembers(updated);
    setEditingMember(null);
    showNotification('Name updated');
  };

  const removeMember = (id) => {
    if (teamMembers.length <= 1) {
      showNotification('Cannot remove last team member', 'error');
      return;
    }
    saveTeamMembers(teamMembers.filter(m => m.id !== id));
    showNotification('Team member removed');
  };

  return (
    <>
      <h2 className="page-title"><Users size={28} /> Team Management</h2>

      <div style={{ marginBottom: '2rem' }}>
        <div className="add-item-row" style={{ maxWidth: '400px' }}>
          <input
            type="text"
            className="add-item-input"
            placeholder="New member name"
            value={newMemberName}
            onChange={e => setNewMemberName(e.target.value)}
          />
          <button className="btn btn-primary btn-small" onClick={addMember}>
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {teamMembers.map(member => {
        const memberOrders = orders.filter(o => o.assignedTo === member.id);
        const activeOrders = memberOrders.filter(o => o.status !== 'shipped');
        const memberFilaments = filaments[member.id] || [];
        const memberParts = externalParts[member.id] || [];
        const totalFilament = memberFilaments.reduce((sum, f) => sum + f.amount, 0);
        const totalParts = memberParts.reduce((sum, p) => sum + p.quantity, 0);

        return (
          <div key={member.id} className="team-member-card">
            <div className="team-member-header">
              {editingMember === member.id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={member.name}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') updateMemberName(member.id, e.target.value);
                      if (e.key === 'Escape') setEditingMember(null);
                    }}
                    style={{ width: '200px' }}
                  />
                  <button className="btn btn-secondary btn-small" onClick={() => setEditingMember(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="team-member-name">
                  <Users size={24} style={{ color: '#00ff88' }} />
                  {member.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-small" onClick={() => setEditingMember(member.id)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-danger btn-small" onClick={() => removeMember(member.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="team-member-stats">
              <div className="team-stat">
                <div className="team-stat-value">{activeOrders.length}</div>
                <div className="team-stat-label">Active Orders</div>
              </div>
              <div className="team-stat">
                <div className="team-stat-value">{totalFilament.toFixed(0)}g</div>
                <div className="team-stat-label">Total Filament</div>
              </div>
              <div className="team-stat">
                <div className="team-stat-value">{totalParts}</div>
                <div className="team-stat-label">External Parts</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default TeamTab;
