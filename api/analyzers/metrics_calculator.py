"""
Metrics Calculator - Computes performance metrics from parsed data
"""

import pandas as pd
import numpy as np
from typing import Dict, List


class MetricsCalculator:
    """
    Calculates performance metrics from parsed test results
    """
    
    def __init__(self, df: pd.DataFrame):
        """
        Initialize with parsed DataFrame
        
        Args:
            df: DataFrame with columns: timestamp, elapsed, label, success, etc.
        """
        self.df = df
        
    def calculate_basic_metrics(self) -> Dict:
        """
        Calculate basic performance metrics
        
        Returns:
            Dictionary with avg, min, max, median, p90, p95, p99 response times
        """
        elapsed = self.df['elapsed']
        
        return {
            'avg_response_time': float(elapsed.mean()),
            'min_response_time': float(elapsed.min()),
            'max_response_time': float(elapsed.max()),
            'median_response_time': float(elapsed.median()),
            'p90_response_time': float(elapsed.quantile(0.90)),
            'p95_response_time': float(elapsed.quantile(0.95)),
            'p99_response_time': float(elapsed.quantile(0.99)),
            'std_dev': float(elapsed.std())
        }
    
    def calculate_throughput(self) -> Dict:
        """
        Calculate throughput metrics (requests per second)
        """
        duration_seconds = (self.df['timestamp'].max() - self.df['timestamp'].min()) / 1000
        total_requests = len(self.df)
        
        return {
            'total_requests': total_requests,
            'duration_seconds': duration_seconds,
            'requests_per_second': total_requests / duration_seconds if duration_seconds > 0 else 0,
            'requests_per_minute': (total_requests / duration_seconds * 60) if duration_seconds > 0 else 0
        }
    
    def calculate_error_metrics(self) -> Dict:
        """
        Calculate error-related metrics
        """
        total = len(self.df)
        failed = len(self.df[~self.df['success']])
        passed = total - failed
        
        # Group errors by response code
        error_breakdown = self.df[~self.df['success']].groupby('response_code').size().to_dict()
        
        return {
            'total_requests': total,
            'passed': passed,
            'failed': failed,
            'error_rate': (failed / total * 100) if total > 0 else 0,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'error_breakdown': error_breakdown
        }
    
    def calculate_per_label_metrics(self) -> List[Dict]:
        """
        Calculate metrics grouped by transaction label
        """
        grouped = self.df.groupby('label')
        
        results = []
        for label, group in grouped:
            total = len(group)
            failed = len(group[~group['success']])
            
            results.append({
                'label': label,
                'count': total,
                'avg_response_time': float(group['elapsed'].mean()),
                'min_response_time': float(group['elapsed'].min()),
                'max_response_time': float(group['elapsed'].max()),
                'p90_response_time': float(group['elapsed'].quantile(0.90)),
                'p95_response_time': float(group['elapsed'].quantile(0.95)),
                'p99_response_time': float(group['elapsed'].quantile(0.99)),
                'error_rate': (failed / total * 100) if total > 0 else 0,
                'throughput': len(group) / ((group['timestamp'].max() - group['timestamp'].min()) / 1000)
            })
        
        return results
    
    def calculate_apdex(self, t_threshold: int = 500, f_threshold: int = 2000) -> Dict:
        """
        Calculate Apdex (Application Performance Index) score
        
        Args:
            t_threshold: Satisfied threshold in milliseconds (default 500ms)
            f_threshold: Frustrated threshold in milliseconds (default 2000ms)
        
        Returns:
            Apdex score and breakdown
        """
        total = len(self.df)
        satisfied = len(self.df[self.df['elapsed'] <= t_threshold])
        tolerating = len(self.df[(self.df['elapsed'] > t_threshold) & (self.df['elapsed'] <= f_threshold)])
        frustrated = len(self.df[self.df['elapsed'] > f_threshold])
        
        # Apdex = (Satisfied + (Tolerating / 2)) / Total
        apdex_score = (satisfied + (tolerating / 2)) / total if total > 0 else 0
        
        return {
            'apdex_score': round(apdex_score, 3),
            'satisfied': satisfied,
            'tolerating': tolerating,
            'frustrated': frustrated,
            'satisfied_pct': (satisfied / total * 100) if total > 0 else 0,
            'tolerating_pct': (tolerating / total * 100) if total > 0 else 0,
            'frustrated_pct': (frustrated / total * 100) if total > 0 else 0,
            't_threshold': t_threshold,
            'f_threshold': f_threshold
        }
    
    def calculate_time_series(self, interval_seconds: float = 1.0) -> Dict:
        """
        Calculate time-series data for charts
        
        Args:
            interval_seconds: Aggregation interval in seconds (default 1.0)
                             Supports sub-second intervals: 0.1 (100ms), 0.5 (500ms), etc.
        
        Returns:
            Dictionary with time-series data for various metrics
        """
        # Create a copy to avoid modifying the original dataframe
        df_copy = self.df.copy()
        
        # Create time-based bins
        # For sub-second intervals, use milliseconds; otherwise use seconds
        if interval_seconds < 1:
            interval_ms = int(interval_seconds * 1000)
            df_copy['time_bin'] = pd.to_datetime(df_copy['timestamp'] / 1000, unit='s').dt.floor(f'{interval_ms}ms')
        else:
            df_copy['time_bin'] = pd.to_datetime(df_copy['timestamp'] / 1000, unit='s').dt.floor(f'{int(interval_seconds)}s')
        
        # Response time over time (per label)
        response_time_series = []
        for label in df_copy['label'].unique():
            label_data = df_copy[df_copy['label'] == label].groupby('time_bin').agg({
                'elapsed': 'mean'
            }).reset_index()
            
            for _, row in label_data.iterrows():
                response_time_series.append({
                    'time': row['time_bin'].isoformat(),
                    'label': label,
                    'avg_response_time': round(float(row['elapsed']), 2)
                })
        
        # Throughput over time
        throughput_series = df_copy.groupby('time_bin').size().reset_index(name='count')
        throughput_series['throughput'] = throughput_series['count'] / interval_seconds
        throughput_data = [
            {
                'time': row['time_bin'].isoformat(),
                'throughput': round(float(row['throughput']), 2),
                'count': int(row['count'])
            }
            for _, row in throughput_series.iterrows()
        ]
        
        # Error rate over time
        error_series = df_copy.groupby('time_bin').agg({
            'success': ['count', 'sum']
        }).reset_index()
        error_series.columns = ['time_bin', 'total', 'success_count']
        error_series['error_count'] = error_series['total'] - error_series['success_count']
        error_series['error_rate'] = (error_series['error_count'] / error_series['total'] * 100)
        error_data = [
            {
                'time': row['time_bin'].isoformat(),
                'error_rate': round(float(row['error_rate']), 2),
                'error_count': int(row['error_count']),
                'total_count': int(row['total'])
            }
            for _, row in error_series.iterrows()
        ]
        
        # Active threads over time (unique thread names per time bin)
        thread_series = df_copy.groupby('time_bin')['thread_name'].nunique().reset_index(name='active_threads')
        thread_data = [
            {
                'time': row['time_bin'].isoformat(),
                'active_threads': int(row['active_threads'])
            }
            for _, row in thread_series.iterrows()
        ]
        
        return {
            'response_time_series': response_time_series,
            'throughput_series': throughput_data,
            'error_series': error_data,
            'thread_series': thread_data,
            'interval_seconds': interval_seconds
        }
    
    def calculate_response_time_histogram(self, num_buckets: int = 20) -> Dict:
        """
        Calculate histogram data for response time distribution
        
        Args:
            num_buckets: Number of histogram buckets (default 20)
        
        Returns:
            Dictionary with histogram buckets and frequencies
        """
        elapsed = self.df['elapsed']
        
        # Calculate histogram using numpy
        counts, bin_edges = np.histogram(elapsed, bins=num_buckets)
        
        # Create bucket ranges
        buckets = []
        for i in range(len(counts)):
            buckets.append({
                'range': f"{int(bin_edges[i])}-{int(bin_edges[i+1])}",
                'min': int(bin_edges[i]),
                'max': int(bin_edges[i+1]),
                'mid': int((bin_edges[i] + bin_edges[i+1]) / 2),
                'count': int(counts[i]),
                'percentage': round(float(counts[i]) / len(elapsed) * 100, 2)
            })
        
        return {
            'buckets': buckets,
            'total_samples': len(elapsed),
            'min_value': float(elapsed.min()),
            'max_value': float(elapsed.max()),
            'num_buckets': num_buckets
        }
    
    def calculate_latency_breakdown(self) -> Dict:
        """
        Calculate breakdown of response time into connect, latency, and processing time
        
        Returns:
            Dictionary with average times for each component
        """
        # Connect time: time to establish connection
        # Latency: time to first byte (after connection)
        # Processing time: remaining time (elapsed - latency)
        
        df_with_times = self.df.copy()
        df_with_times['processing_time'] = df_with_times['elapsed'] - df_with_times['latency']
        
        # Calculate averages per label
        breakdown_by_label = []
        for label in self.df['label'].unique():
            label_data = df_with_times[df_with_times['label'] == label]
            
            breakdown_by_label.append({
                'label': label,
                'avg_connect_time': float(label_data['connect_time'].mean()),
                'avg_latency': float(label_data['latency'].mean()) - float(label_data['connect_time'].mean()),
                'avg_processing_time': float(label_data['processing_time'].mean()),
                'avg_total': float(label_data['elapsed'].mean()),
                'count': len(label_data)
            })
        
        # Overall averages
        return {
            'by_label': breakdown_by_label,
            'overall': {
                'avg_connect_time': float(df_with_times['connect_time'].mean()),
                'avg_latency': float(df_with_times['latency'].mean()) - float(df_with_times['connect_time'].mean()),
                'avg_processing_time': float(df_with_times['processing_time'].mean()),
                'avg_total': float(df_with_times['elapsed'].mean())
            }
        }
    
    def calculate_percentiles_over_time(self, interval_seconds: float = 1.0) -> List[Dict]:
        """
        Calculate percentiles (P50, P75, P90, P95, P99) over time
        
        Args:
            interval_seconds: Time interval for aggregation (default 1.0)
        
        Returns:
            List of time-series data with percentiles
        """
        # Create a copy to avoid modifying the original dataframe
        df_copy = self.df.copy()
        
        # Create time-based bins
        if interval_seconds < 1:
            interval_ms = int(interval_seconds * 1000)
            df_copy['time_bin'] = pd.to_datetime(df_copy['timestamp'] / 1000, unit='s').dt.floor(f'{interval_ms}ms')
        else:
            df_copy['time_bin'] = pd.to_datetime(df_copy['timestamp'] / 1000, unit='s').dt.floor(f'{int(interval_seconds)}s')
        
        # Calculate percentiles for each time bin
        percentiles_data = df_copy.groupby('time_bin')['elapsed'].quantile([0.50, 0.75, 0.90, 0.95, 0.99]).unstack()
        percentiles_data.columns = ['p50', 'p75', 'p90', 'p95', 'p99']
        percentiles_data = percentiles_data.reset_index()
        
        result = [
            {
                'time': row['time_bin'].isoformat(),
                'p50': round(float(row['p50']), 2),
                'p75': round(float(row['p75']), 2),
                'p90': round(float(row['p90']), 2),
                'p95': round(float(row['p95']), 2),
                'p99': round(float(row['p99']), 2)
            }
            for _, row in percentiles_data.iterrows()
        ]
        
        return result
        
        return result
    
    def get_all_metrics(self, include_time_series: bool = True, interval_seconds: float = 1.0) -> Dict:
        """
        Calculate and return all metrics in one call
        
        Args:
            include_time_series: Whether to include time-series data for charts
            interval_seconds: Time interval for time-series aggregation (default 1.0)
        """
        metrics = {
            'basic_metrics': self.calculate_basic_metrics(),
            'throughput': self.calculate_throughput(),
            'errors': self.calculate_error_metrics(),
            'per_label': self.calculate_per_label_metrics(),
            'apdex': self.calculate_apdex(),
            'histogram': self.calculate_response_time_histogram(),
            'latency_breakdown': self.calculate_latency_breakdown(),
        }
        
        if include_time_series:
            metrics['time_series'] = self.calculate_time_series(interval_seconds=interval_seconds)
            metrics['percentiles_over_time'] = self.calculate_percentiles_over_time(interval_seconds=interval_seconds)
        
        return metrics


# Example usage
if __name__ == '__main__':
    # Test with sample data
    from parsers.jtl_parser import JTLParser
    
    parser = JTLParser('../../sample-data/sample-results.jtl')
    df = parser.parse()
    
    calculator = MetricsCalculator(df)
    metrics = calculator.get_all_metrics()
    
    print("All Metrics:")
    print(f"Avg Response Time: {metrics['basic_metrics']['avg_response_time']:.2f}ms")
    print(f"Throughput: {metrics['throughput']['requests_per_second']:.2f} req/s")
    print(f"Error Rate: {metrics['errors']['error_rate']:.2f}%")
    print(f"Apdex Score: {metrics['apdex']['apdex_score']}")
