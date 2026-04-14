# utils/performance_tracker.py
import json
import pandas as pd
from datetime import datetime, timedelta
import os

class PerformanceTracker:
    def __init__(self, data_file="performance_data.json"):
        self.data_dir = "performance_data"
        self.data_file = os.path.join(self.data_dir, data_file)
        self._ensure_data_dir()
        self.load_data()
    
    def _ensure_data_dir(self):
        """Create data directory if it doesn't exist"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def load_data(self):
        """Load existing performance data"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.data = []
    
    def save_data(self):
        """Save performance data"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving performance data: {e}")
    
    def record_interaction(self, input_lang, output_lang, response_time, 
                         input_length, response_length, user_question=""):
        """Record a complete interaction"""
        record = {
            'timestamp': datetime.now().isoformat(),
            'input_language': input_lang,
            'output_language': output_lang,
            'response_time_seconds': round(response_time, 2),
            'input_length': input_length,
            'response_length': response_length,
            'user_question': user_question[:100]  # Store first 100 chars for context
        }
        
        self.data.append(record)
        self.save_data()
        
        # Also keep a backup in session state for real-time display
        
        # Keep only last 50 in session state
    
    def get_language_performance(self, days=7):
        """Get performance statistics by language for given period"""
        if not self.data:
            return {}
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_data = [
            record for record in self.data 
            if datetime.fromisoformat(record['timestamp']) > cutoff_date
        ]
        
        if not recent_data:
            return {}
        
        df = pd.DataFrame(recent_data)
        
        stats = df.groupby('output_language').agg({
            'response_time_seconds': ['count', 'mean', 'median', 'min', 'max', 'std'],
            'input_length': 'mean',
            'response_length': 'mean'
        }).round(2)
        
        # Flatten column names
        stats.columns = ['_'.join(col).strip() for col in stats.columns.values]
        return stats.to_dict('index')
    
    def get_response_time_trends(self, language=None, days=7):
        """Get response time trends over time"""
        if not self.data:
            return {}
        
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_data = [
            record for record in self.data 
            if datetime.fromisoformat(record['timestamp']) > cutoff_date
        ]
        
        if language:
            filtered_data = [r for r in filtered_data if r['output_language'] == language]
        
        if not filtered_data:
            return {}
        
        df = pd.DataFrame(filtered_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['date'] = df['timestamp'].dt.date
        
        daily_stats = df.groupby('date').agg({
            'response_time_seconds': ['mean', 'count']
        }).round(2)
        
        return daily_stats.to_dict()
    
    def generate_performance_report(self, days=7):
        """Generate a comprehensive performance report"""
        lang_stats = self.get_language_performance(days)
        
        if not lang_stats:
            return "No performance data available for the specified period."
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'analysis_period_days': days,
            'total_interactions': sum([stats['response_time_seconds_count'] for stats in lang_stats.values()]),
            'language_performance': lang_stats,
            'overall_metrics': self._calculate_overall_metrics(lang_stats),
            'recommendations': self._generate_recommendations(lang_stats)
        }
        
        return report
    
    def _calculate_overall_metrics(self, lang_stats):
        """Calculate overall performance metrics"""
        total_interactions = sum([stats['response_time_seconds_count'] for stats in lang_stats.values()])
        avg_response_time = sum([stats['response_time_seconds_mean'] * stats['response_time_seconds_count'] 
                               for stats in lang_stats.values()]) / total_interactions
        
        return {
            'average_response_time_seconds': round(avg_response_time, 2),
            'total_languages_tracked': len(lang_stats),
            'most_used_language': max(lang_stats.items(), 
                                    key=lambda x: x[1]['response_time_seconds_count'])[0],
            'fastest_language': min(lang_stats.items(), 
                                  key=lambda x: x[1]['response_time_seconds_mean'])[0],
            'slowest_language': max(lang_stats.items(), 
                                  key=lambda x: x[1]['response_time_seconds_mean'])[0]
        }
    
    def _generate_recommendations(self, lang_stats):
        """Generate performance recommendations"""
        recommendations = []
        
        for lang, stats in lang_stats.items():
            avg_time = stats['response_time_seconds_mean']
            
            if avg_time > 6:
                recommendations.append(f"🚨 {lang}: Very slow response time ({avg_time}s). Consider optimization.")
            elif avg_time > 4:
                recommendations.append(f"⚠️ {lang}: Slow response time ({avg_time}s). Monitor closely.")
            elif avg_time < 2:
                recommendations.append(f"✅ {lang}: Excellent performance ({avg_time}s).")
            else:
                recommendations.append(f"✓ {lang}: Good performance ({avg_time}s).")
        
        return recommendations
    
    def export_to_csv(self, days=7):
        """Export performance data to CSV format"""
        if not self.data:
            return None
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_data = [
            record for record in self.data 
            if datetime.fromisoformat(record['timestamp']) > cutoff_date
        ]
        
        if not recent_data:
            return None
        
        df = pd.DataFrame(recent_data)
        return df.to_csv(index=False, encoding='utf-8')
    
    def get_real_time_stats(self):
        """Get real-time statistics from session state"""
            return {}
        
        stats = df.groupby('output_language')['response_time_seconds'].agg([
            'count', 'mean', 'median'
        ]).round(2)
        
        return stats.to_dict('index')

# Global instance
performance_tracker = PerformanceTracker()