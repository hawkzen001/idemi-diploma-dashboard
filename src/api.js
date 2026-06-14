import Papa from 'papaparse';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1TRkzM1g8SBxy-DfcimxJ-l2UNHTHwgUOym1s7NglxCE/export?format=csv';

export const fetchApplications = async () => {
  return new Promise((resolve, reject) => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Clean and map data
        let data = results.data
          .filter(row => row['Timestamp']) // ensure row has data
          .map(row => ({
            id: row['Timestamp'] + row['Email Address'], // generate a unique ID
            timestamp: row['Timestamp'],
            email: row['Email Address'],
            name: row['Full Name (in Capital letters)'] ? row['Full Name (in Capital letters)'].toUpperCase() : '',
            mobile: row['Mobile Number'],
            gender: row['Gender'],
            dob: row['Date of Birth'],
            caste: row['Caste :'],
            casteDocUrl: row['If belong to Reserve Category (e.g SC/ST/OBC/NT etc.) kindly attach relevant document indicating Caste'],
            sscResultUrl: row['SSC Result (kindly upload SSC marksheet - Even online is accepted)'],
            aadhaarUrl: row['Aadhaar Card (OR any other document indicating Age )'],
            paymentUrl: row['If ₹200 has been paid kindly attach the payment screenshot showing payment details of registration'],
            photoUrl: row['Passport Size Photo'],
            course: row['Applying for :'],
            paymentStatus: row['Kindly register by making payment of ₹200.To make payment click here   https://pages.razorpay.com/pl_FCgdh0OW9UvBrC/view  OR scan QR code\n(Ignore if payment already made)']
          }));
        
        // Filter out everything before ARYAN JITENDRA PATHANE's date
        const aryan = data.find(d => d.name && d.name.toUpperCase().includes('ARYAN JITENDRA PATHANE'));
        if (aryan && aryan.timestamp) {
          const cutoffDate = new Date(aryan.timestamp);
          data = data.filter(d => {
            if (!d.timestamp) return false;
            const rowDate = new Date(d.timestamp);
            return rowDate >= cutoffDate;
          });
        }

        // Only consider valid courses
        data = data.filter(d => 
          d.course && (
            d.course.toLowerCase().includes('3d animation') ||
            d.course.toLowerCase().includes('mechatronics') ||
            d.course.toLowerCase().includes('tool & die')
          )
        );

        resolve(data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
