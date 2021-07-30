import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<any>
) {
  res.status(200).json({ name: 'John Doe' })
}
