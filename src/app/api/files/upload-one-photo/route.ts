import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const menu = formData.get('menu') as string;

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    console.log(`Mock upload: ${photo.name}, size: ${photo.size}, menu: ${menu}`);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a mock URL
    const mockUrl = `https://example.com/uploads/mock_${Date.now()}_${photo.name}`;
    
    return NextResponse.json({ 
      imageUrl: mockUrl,
      message: 'Mock upload successful'
    });
  } catch (error) {
    console.error('Mock upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
