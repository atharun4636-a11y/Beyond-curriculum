import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Search, Trophy, Medal, Award, Flame } from 'lucide-react';
import { getDB, defaultEmployees, defaultSubmissions, defaultDepartments } from '../utils/db';
import './Leaderboard.css';

export const Leaderboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hackathonFilter, setHackathonFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  const employees = getDB('employees', defaultEmployees);
  const submissions = getDB('submissions', defaultSubmissions);
  const departments = getDB('departments', defaultDepartments);

  const rankingData = employees.map(emp => {
    const sub = submissions.find(s => s.developer.toLowerCase() === emp.name.toLowerCase());
    const dept = departments.find(d => d.id === emp.departmentId || (emp.department && d.name.toLowerCase() === emp.department.toLowerCase()));
    return {
      name: emp.name,
      departmentId: emp.departmentId,
      department: dept ? dept.name : emp.department || 'N/A',
      project: sub ? sub.title : 'N/A',
      platform: sub ? sub.platform : 'N/A',
      score: emp.score,
      hackathon: sub ? 'AI Revolution' : 'N/A',
      month: 'August'
    };
  })
  .sort((a, b) => b.score - a.score)
  .map((item, idx) => ({ ...item, rank: idx + 1 }));

  const filteredRankings = rankingData.filter(rank => {
    const matchesSearch = rank.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rank.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHack = hackathonFilter ? rank.hackathon === hackathonFilter : true;
    
    let matchesDept = true;
    if (deptFilter) {
      matchesDept = rank.departmentId === parseInt(deptFilter) || 
                    (rank.department && departments.find(d => d.id === parseInt(deptFilter))?.name.toLowerCase() === rank.department.toLowerCase());
    }

    const matchesPlatform = platformFilter ? rank.platform === platformFilter : true;
    
    return matchesSearch && matchesHack && matchesDept && matchesPlatform;
  });

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} className="rank-gold" />;
    if (rank === 2) return <Medal size={20} className="rank-silver" />;
    if (rank === 3) return <Award size={20} className="rank-bronze" />;
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="leaderboard-page">
      <div className="section-header">
        <div>
          <h1>Global Leaderboard</h1>
          <p className="subtitle">Track real-time hackathon standings, project evaluation, and platform rankings</p>
        </div>
      </div>

      {/* Top 3 highlights */}
      <div className="podium-section">
        {rankingData.slice(0, 3).map((pod, idx) => (
          <Card key={pod.rank} className={`podium-card podium-${pod.rank} glass`}>
            <div className="podium-rank">
              {idx === 0 && <Flame className="hot-flame" />}
              {getRankIcon(pod.rank)}
            </div>
            <h3>{pod.name}</h3>
            <span className="podium-project">{pod.project}</span>
            <span className="podium-score">{pod.score} pts</span>
            <span className="podium-dept">{pod.department} • {pod.platform}</span>
          </Card>
        ))}
      </div>

      <Card className="leaderboard-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employee or project..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select value={hackathonFilter} onChange={(e) => setHackathonFilter(e.target.value)}>
            <option value="">All Hackathons</option>
            <option value="AI Revolution">AI Revolution</option>
            <option value="CodeStorm 2026">CodeStorm 2026</option>
          </select>
 
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} {d.status === 'Inactive' ? '(Deactivated)' : ''}</option>
            ))}
          </select>
 
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="">All Platforms</option>
            <option value="Lovable">Lovable</option>
            <option value="Bolt.new">Bolt.new</option>
            <option value="Firebase Studio">Firebase Studio</option>
            <option value="Replit">Replit</option>
          </select>
        </div>
      </Card>

      <Card className="table-card">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Project Name</th>
              <th>Platform</th>
              <th>Official Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredRankings.map(row => (
              <tr key={row.rank}>
                <td className="rank-cell">{getRankIcon(row.rank)}</td>
                <td className="emp-name">{row.name}</td>
                <td>{row.department}</td>
                <td className="proj-title">{row.project}</td>
                <td><span className="platform-tag">{row.platform}</span></td>
                <td className="score-cell"><strong>{row.score}/100</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
