import { api } from './api.js'

test('upload results survive in sessionStorage and blocked storage does not throw', async () => {
  const result = { file_id: 'f9', questions: [] }
  globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => result }))
  await api.uploadFile(new File(['x'], 'a.csv'))
  expect(JSON.parse(sessionStorage.getItem('dw.result.f9'))).toEqual(result)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  await expect(api.uploadFile(new File(['x'], 'a.csv'))).resolves.toEqual(result)
  expect(api.uploadResult('f9')).toEqual(result)
  expect(api.uploadResult('nope')).toBeNull()
})
