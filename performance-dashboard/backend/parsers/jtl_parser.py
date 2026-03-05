"""
JTL Parser - Parses JMeter result files (.jtl format)
Handles both CSV and XML formats
"""

import pandas as pd
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Sample:
    """Represents a single test sample/transaction"""
    timestamp: int
    elapsed: int
    label: str
    response_code: str
    response_message: str
    thread_name: str
    success: bool
    bytes_sent: int
    bytes_received: int
    latency: int
    connect_time: int
    

class JTLParser:
    """
    Parser for JMeter JTL result files
    Supports CSV format (most common) and XML format
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.samples: List[Sample] = []
        self.df: Optional[pd.DataFrame] = None
        
    def parse(self) -> pd.DataFrame:
        """
        Parse JTL file and return pandas DataFrame
        Auto-detects format (CSV vs XML)
        """
        # Try CSV format first (most common)
        try:
            self.df = self._parse_csv()
            print(f"Parsed {len(self.df)} samples from CSV format")
            return self.df
        except Exception as e:
            print(f"CSV parsing failed: {e}")
            
        # Fall back to XML format
        try:
            self.df = self._parse_xml()
            print(f"Parsed {len(self.df)} samples from XML format")
            return self.df
        except Exception as e:
            raise ValueError(f"Failed to parse JTL file: {e}")
    
    def _parse_csv(self) -> pd.DataFrame:
        """Parse CSV format JTL file"""
        # Common CSV column names in JMeter results
        df = pd.read_csv(self.file_path)
        
        # Standardize column names (JMeter uses various naming conventions)
        column_mapping = {
            'timeStamp': 'timestamp',
            'elapsed': 'elapsed',
            'label': 'label',
            'responseCode': 'response_code',
            'responseMessage': 'response_message',
            'threadName': 'thread_name',
            'success': 'success',
            'bytes': 'bytes_received',
            'sentBytes': 'bytes_sent',
            'Latency': 'latency',
            'Connect': 'connect_time'
        }
        
        df = df.rename(columns=column_mapping)
        
        # Convert timestamp to datetime
        df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Convert success to boolean
        df['success'] = df['success'].astype(str).str.lower() == 'true'
        
        return df
    
    def _parse_xml(self) -> pd.DataFrame:
        """Parse XML format JTL file"""
        tree = ET.parse(self.file_path)
        root = tree.getroot()
        
        records = []
        for sample in root.findall('.//httpSample') + root.findall('.//sample'):
            records.append({
                'timestamp': int(sample.get('t', 0)),
                'elapsed': int(sample.get('lt', 0)),
                'label': sample.get('lb', ''),
                'response_code': sample.get('rc', ''),
                'response_message': sample.get('rm', ''),
                'thread_name': sample.get('tn', ''),
                'success': sample.get('s', 'true').lower() == 'true',
                'bytes_received': int(sample.get('by', 0)),
                'bytes_sent': int(sample.get('sby', 0)),
                'latency': int(sample.get('lt', 0)),
                'connect_time': int(sample.get('ct', 0))
            })
        
        df = pd.DataFrame(records)
        df['datetime'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        return df
    
    def get_summary(self) -> Dict:
        """Get high-level summary statistics"""
        if self.df is None:
            raise ValueError("No data parsed. Call parse() first.")
        
        total_samples = len(self.df)
        failed_samples = len(self.df[~self.df['success']])
        
        return {
            'total_samples': total_samples,
            'passed': total_samples - failed_samples,
            'failed': failed_samples,
            'error_rate': (failed_samples / total_samples * 100) if total_samples > 0 else 0,
            'duration_seconds': (self.df['timestamp'].max() - self.df['timestamp'].min()) / 1000,
            'unique_labels': self.df['label'].nunique(),
            'start_time': self.df['datetime'].min().isoformat(),
            'end_time': self.df['datetime'].max().isoformat()
        }


# Example usage
if __name__ == '__main__':
    # Test with sample file
    parser = JTLParser('../../sample-data/sample-results.jtl')
    df = parser.parse()
    print("\nSummary Statistics:")
    print(parser.get_summary())
    print("\nDataFrame Info:")
    print(df.info())
