import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';


const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

if (!connectionString || !accountName || !containerName) {
  throw new Error("Missing Azure Storage configuration");
}



const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function POST(request: NextRequest) {
  try {
    try {
      await containerClient.createIfNotExists({
        access: 'blob' 
      });
    } catch (containerError) {
      console.log("📝 Container already exists or creation skipped");
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // File size validation (optional - 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Generate unique blob name
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `${timestamp}-${sanitizedFileName}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type || 'application/octet-stream',
      },
    });

    const fileUrl = blockBlobClient.url;

    console.log(" Upload successful:", fileUrl);
  

    return NextResponse.json({ 
      url: fileUrl,
      fileName: file.name,
      size: file.size,
      blobName: blobName
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}